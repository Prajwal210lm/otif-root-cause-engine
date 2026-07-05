from otif.types import Order, Signals, Counterfactuals, FinancialImpact
from otif.constants import (
    DEMAND_TOL,
    SUPPLIER_LATE_TOL,
    DISPATCH_TOL,
    TRANSIT_TOL,
    PENALTY_RATE,
    REDELIVERY_FEE,
    MARGIN_RATE,
    NAIVE_DEMAND_SCALE,
    NAIVE_SUPPLIER_SCALE,
    NAIVE_DISPATCH_SCALE,
    NAIVE_PICKSHORT_SCALE,
    NAIVE_PRIORITY,
    DRIVERS,
)


def compute_signals(order: Order) -> Signals:
    """Compute deterministic per-domain signals from raw order fields."""
    order_value = order.order_qty * order.unit_value
    forecast_error_pct = (order.actual_period_demand - order.forecast_qty) / order.forecast_qty
    supplier_late_days = max(0, order.actual_goods_receipt_date - order.po_promised_receipt_date)
    stock_sufficient = order.on_hand_at_pick >= order.order_qty
    pick_short_units = max(0, order.order_qty - order.picked_qty)
    dispatch_delay_days = max(0, order.dispatch_date - order.pick_ready_date)
    transit_overage_days = max(0, (order.delivered_date - order.dispatch_date) - order.lane_sla_days)
    shortfall_units = max(0, order.order_qty - order.delivered_qty)
    shortfall_value = shortfall_units * order.unit_value

    demand_fired = (forecast_error_pct > DEMAND_TOL) and (not stock_sufficient)
    supplier_fired = (supplier_late_days > SUPPLIER_LATE_TOL) and (not stock_sufficient)
    warehouse_fired = (stock_sufficient and pick_short_units > 0) or (dispatch_delay_days > DISPATCH_TOL)
    logistics_fired = transit_overage_days > TRANSIT_TOL

    return Signals(
        order_value=order_value,
        forecast_error_pct=forecast_error_pct,
        supplier_late_days=supplier_late_days,
        stock_sufficient_at_pick=stock_sufficient,
        pick_short_units=pick_short_units,
        dispatch_delay_days=dispatch_delay_days,
        transit_overage_days=transit_overage_days,
        shortfall_units=shortfall_units,
        shortfall_value=shortfall_value,
        demand_fired=demand_fired,
        supplier_fired=supplier_fired,
        warehouse_fired=warehouse_fired,
        logistics_fired=logistics_fired,
    )


def compute_counterfactuals(order: Order, signals: Signals) -> Counterfactuals:
    """Compute per-domain 'would this fix alone save the order' facts."""
    base_in_full = order.delivered_qty >= order.order_qty
    base_on_time = order.delivered_date <= order.promised_date
    actual_transit = order.delivered_date - order.dispatch_date

    demand_extra = max(0, order.actual_period_demand - order.forecast_qty)
    demand_in_full = (order.on_hand_at_pick + demand_extra) >= order.order_qty
    demand_saves = demand_in_full and base_on_time

    supplier_in_full = (order.on_hand_at_pick + order.po_qty) >= order.order_qty
    supplier_saves = supplier_in_full and base_on_time

    warehouse_in_full = True if signals.stock_sufficient_at_pick else base_in_full
    warehouse_on_time = (order.pick_ready_date + actual_transit) <= order.promised_date
    warehouse_saves = warehouse_in_full and warehouse_on_time

    logistics_on_time = (order.dispatch_date + order.lane_sla_days) <= order.promised_date
    logistics_saves = base_in_full and logistics_on_time

    return Counterfactuals(
        demand_saves=demand_saves,
        supplier_saves=supplier_saves,
        warehouse_saves=warehouse_saves,
        logistics_saves=logistics_saves,
    )


def compute_financial_impact(order: Order, signals: Signals) -> FinancialImpact:
    """Compute penalty, recovery cost, lost margin, and total from the schedule."""
    penalty = PENALTY_RATE[order.channel] * signals.order_value
    recovery_cost = REDELIVERY_FEE if (signals.shortfall_units > 0 and order.redelivered) else 0.0
    lost_margin = (
        MARGIN_RATE * signals.shortfall_value
        if (signals.shortfall_units > 0 and order.cancelled_shortfall)
        else 0.0
    )
    total = penalty + recovery_cost + lost_margin
    return FinancialImpact(
        penalty=penalty,
        recovery_cost=recovery_cost,
        lost_margin=lost_margin,
        total=total,
    )


def _fired_domains(signals: Signals) -> list:
    fired = []
    if signals.demand_fired:
        fired.append("demand")
    if signals.supplier_fired:
        fired.append("supplier")
    if signals.warehouse_fired:
        fired.append("warehouse")
    if signals.logistics_fired:
        fired.append("logistics")
    return fired


def naive_attribution(order: Order, signals: Signals) -> str:
    """Deterministic largest-single-signal strawman attributor."""
    fired = _fired_domains(signals)
    severity = {
        "demand": signals.forecast_error_pct / NAIVE_DEMAND_SCALE,
        "supplier": signals.supplier_late_days / NAIVE_SUPPLIER_SCALE,
        "warehouse": max(
            signals.pick_short_units / (NAIVE_PICKSHORT_SCALE * order.order_qty),
            signals.dispatch_delay_days / NAIVE_DISPATCH_SCALE,
        ),
        "logistics": signals.transit_overage_days / order.lane_sla_days,
    }
    return max(fired, key=lambda d: (severity[d], -NAIVE_PRIORITY.index(d)))


def _axis(order: Order, signals: Signals, domain: str) -> str:
    if domain in ("demand", "supplier"):
        return "in_full"
    if domain == "logistics":
        return "on_time"
    if signals.stock_sufficient_at_pick and signals.pick_short_units > 0:
        return "in_full"
    return "on_time"


def _gap_share(order: Order, signals: Signals, domain: str) -> int:
    if domain == "demand":
        return max(0, order.actual_period_demand - order.forecast_qty)
    if domain == "supplier":
        return order.po_qty
    if domain == "logistics":
        return signals.transit_overage_days
    if _axis(order, signals, "warehouse") == "in_full":
        return signals.pick_short_units
    return signals.dispatch_delay_days


def oracle_attribution(order: Order, signals: Signals, cf: Counterfactuals) -> str:
    """GROUND-TRUTH LABELER. Used only to plant labels. Never passed to the coordinator agent."""
    fired = _fired_domains(signals)
    if len(fired) == 1:
        return fired[0]

    saves_map = {
        "demand": cf.demand_saves,
        "supplier": cf.supplier_saves,
        "warehouse": cf.warehouse_saves,
        "logistics": cf.logistics_saves,
    }
    savers = [d for d in fired if saves_map[d]]

    if len(savers) == 1:
        return savers[0]

    axes = {_axis(order, signals, d) for d in fired}
    if axes == {"in_full", "on_time"}:
        return next(d for d in fired if _axis(order, signals, d) == "in_full")

    return max(fired, key=lambda d: (_gap_share(order, signals, d), -DRIVERS.index(d)))
