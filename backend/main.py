from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.products import router as products_router
from routes.customers import router as customers_router
from routes.calls import router as calls_router
from routes.analytics import router as analytics_router
from routes.twilio_routes import router as twilio_router

app = FastAPI(title="Sales Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(customers_router)
app.include_router(calls_router)
app.include_router(analytics_router)
app.include_router(twilio_router)

@app.get("/")
def root():
    return {"status": "Sales Agent API is running"}