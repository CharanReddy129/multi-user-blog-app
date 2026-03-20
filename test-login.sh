#!/bin/bash
curl -v -X POST http://<IP_address>:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@blog.com","password":"user123"}'
