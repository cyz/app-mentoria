from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def test():
    return {"message": "test working"}

@app.get("/test-switch")
def test_switch():
    return {"result": "switch endpoint working"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
