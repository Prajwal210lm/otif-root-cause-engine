from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    order_id: str
    channel: str
    sku_id: str
    sku_category: str
    order_qty: int
    unit_value: float
    promised_date: int
    forecast_qty: int
    actual_period_demand: int
    po_qty: int
    po_promised_receipt_date: int
    actual_goods_receipt_date: int
    on_hand_at_pick: int
    picked_qty: int
    pick_ready_date: int
    dispatch_date: int
    lane: str
    lane_sla_days: int
    delivered_date: int
    delivered_qty: int
    redelivered: bool
    cancelled_shortfall: bool


@dataclass(frozen=True)
class Signals:
    order_value: float
    forecast_error_pct: float
    supplier_late_days: int
    stock_sufficient_at_pick: bool
    pick_short_units: int
    dispatch_delay_days: int
    transit_overage_days: int
    shortfall_units: int
    shortfall_value: float
    demand_fired: bool
    supplier_fired: bool
    warehouse_fired: bool
    logistics_fired: bool


@dataclass(frozen=True)
class Counterfactuals:
    demand_saves: bool
    supplier_saves: bool
    warehouse_saves: bool
    logistics_saves: bool


@dataclass(frozen=True)
class FinancialImpact:
    penalty: float
    recovery_cost: float
    lost_margin: float
    total: float
