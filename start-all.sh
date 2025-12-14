#!/bin/bash

cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

sleep 2

npm run dev

kill $FASTAPI_PID 2>/dev/null
