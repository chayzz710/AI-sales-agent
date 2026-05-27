from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary():
    total_calls = db.call_logs.count_documents({})
    total_sales = db.sales.count_documents({})
    positive = db.call_logs.count_documents({"outcome": "positive"})
    negative = db.call_logs.count_documents({"outcome": "negative"})
    neutral = db.call_logs.count_documents({"outcome": "neutral"})

    revenue_result = list(db.sales.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$selling_price"}}}
    ]))
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    conversion_rate = round((positive / total_calls) * 100, 1) if total_calls > 0 else 0

    return {
        "total_calls": total_calls,
        "total_sales": total_sales,
        "total_revenue": round(total_revenue, 2),
        "conversion_rate": conversion_rate,
        "outcomes": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral
        }
    }


@router.get("/monthly-revenue")
def get_monthly_revenue():
    pipeline = [
        {"$group": {
            "_id": {
                "year": {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"}
            },
            "revenue": {"$sum": "$selling_price"},
            "sales": {"$sum": 1}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}
    ]
    results = list(db.sales.aggregate(pipeline))
    return [
        {
            "month": f"{r['_id']['year']}-{str(r['_id']['month']).zfill(2)}",
            "revenue": round(r["revenue"], 2),
            "sales": r["sales"]
        }
        for r in results
    ]


@router.get("/monthly-calls")
def get_monthly_calls():
    pipeline = [
        {"$group": {
            "_id": {
                "year": {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"}
            },
            "total": {"$sum": 1},
            "positive": {"$sum": {"$cond": [{"$eq": ["$outcome", "positive"]}, 1, 0]}}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}
    ]
    results = list(db.call_logs.aggregate(pipeline))
    return [
        {
            "month": f"{r['_id']['year']}-{str(r['_id']['month']).zfill(2)}",
            "total": r["total"],
            "positive": r["positive"]
        }
        for r in results
    ]


@router.get("/top-products")
def get_top_products():
    pipeline = [
        {"$group": {
            "_id": "$product_name",
            "revenue": {"$sum": "$selling_price"},
            "units": {"$sum": 1}
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": 5}
    ]
    results = list(db.sales.aggregate(pipeline))
    return [
        {
            "name": r["_id"],
            "revenue": round(r["revenue"], 2),
            "units": r["units"]
        }
        for r in results
    ]


@router.get("/recent-calls")
def get_recent_calls():
    calls = list(db.call_logs.find().sort("timestamp", -1).limit(20))
    for call in calls:
        call["id"] = str(call.pop("_id"))
        call.pop("history", None)
        if "timestamp" in call:
            call["timestamp"] = call["timestamp"].isoformat()
    return calls


@router.get("/call-detail/{session_id}")
def get_call_detail(session_id: str):
    call = db.call_logs.find_one({"session_id": session_id})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call["id"] = str(call.pop("_id"))
    if "timestamp" in call:
        call["timestamp"] = call["timestamp"].isoformat()
    return call