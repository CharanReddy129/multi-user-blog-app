#!/bin/bash
curl -v -X POST http://172.30.85.64:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@blog.com","password":"user123"}'
