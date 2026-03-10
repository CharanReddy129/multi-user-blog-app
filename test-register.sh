#!/bin/bash
echo "=== Health Check ==="
curl -s http://172.30.85.64:5000/api/health
echo ""

echo "=== Login with demo credentials ==="
curl -s -X POST http://172.30.85.64:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@blog.com","password":"user123"}'
echo ""

echo "=== Get Posts ==="
curl -s http://172.30.85.64:5000/api/posts | python3 -m json.tool 2>/dev/null || curl -s http://172.30.85.64:5000/api/posts
echo ""
