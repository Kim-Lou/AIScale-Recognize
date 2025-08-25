#!/bin/bash
echo "Testing API endpoints..."
echo ""

# Test login endpoint
echo "1. Testing login endpoint:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "Login response: $LOGIN_RESPONSE"

# Extract token for authenticated requests
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')

echo ""
echo "2. Testing users endpoint with token:"
if [ ! -z "$TOKEN" ]; then
  curl -s -X GET http://localhost:8080/api/users \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nHTTP Status: %{http_code}\n"
else
  echo "No token available"
fi

echo ""
echo "3. Testing dashboard endpoint with token:"
if [ ! -z "$TOKEN" ]; then
  curl -s -X GET http://localhost:8080/api/dashboard/today-stats \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nHTTP Status: %{http_code}\n"
else
  echo "No token available"
fi

echo ""
echo "4. Testing customers endpoint with token:"
if [ ! -z "$TOKEN" ]; then
  curl -s -X GET http://localhost:8080/api/customers \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nHTTP Status: %{http_code}\n"
else
  echo "No token available"
fi

echo ""
echo "API testing complete."