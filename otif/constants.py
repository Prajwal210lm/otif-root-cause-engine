DEMAND_TOL = 0.15
SUPPLIER_LATE_TOL = 0
DISPATCH_TOL = 0
TRANSIT_TOL = 0
PENALTY_RATE = {"modern_trade": 0.02, "pharmacy": 0.03}
REDELIVERY_FEE = 350.0
MARGIN_RATE = 0.12
NAIVE_DEMAND_SCALE = 0.15
NAIVE_SUPPLIER_SCALE = 7
NAIVE_DISPATCH_SCALE = 2
NAIVE_PICKSHORT_SCALE = 0.10
DRIVERS = ("demand", "supplier", "warehouse", "logistics")
# DRIVERS order is also the fulfillment-chain order (earliest link first),
# used by the oracle's "earlier link wins" tie-break.
# Naive severity tie-break priority (a deliberately different order):
NAIVE_PRIORITY = ("supplier", "demand", "warehouse", "logistics")
