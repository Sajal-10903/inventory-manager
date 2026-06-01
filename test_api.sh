#!/bin/bash
# ============================================
# Inventory & Order Management System
# Assessment Test Script
# ============================================

BASE="http://localhost:8000/api"
PASS=0
FAIL=0

green() { echo -e "\033[32m✅ PASS: $1\033[0m"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m❌ FAIL: $1\033[0m"; FAIL=$((FAIL+1)); }
header(){ echo -e "\n\033[1;36m━━━ $1 ━━━\033[0m"; }

check() {
    local desc="$1" expected="$2" actual="$3"
    if echo "$actual" | grep -q "$expected"; then
        green "$desc"
    else
        red "$desc — expected '$expected', got: $actual"
    fi
}

# ──────────────────────────────────────────────
header "1. HEALTH CHECK"
# ──────────────────────────────────────────────
RESP=$(curl -s "$BASE/health")
check "Health endpoint" '"status":"healthy"' "$RESP"

# ──────────────────────────────────────────────
header "2. PRODUCT CRUD"
# ──────────────────────────────────────────────

echo "Creating Product 1 (iPhone 17)..."
RESP=$(curl -s -X POST "$BASE/products" \
  -H "Content-Type: application/json" \
  -d '{"sku":"IPHONE-17","name":"iPhone 17","price":899.00,"stock":5}')
check "Create Product 1" '"sku":"IPHONE-17"' "$RESP"
echo "  → $RESP"

echo ""
echo "Creating Product 2 (MacBook Pro M5)..."
RESP=$(curl -s -X POST "$BASE/products" \
  -H "Content-Type: application/json" \
  -d '{"sku":"MACBOOK-M5","name":"MacBook Pro M5","price":2499.00,"stock":3}')
check "Create Product 2" '"sku":"MACBOOK-M5"' "$RESP"
echo "  → $RESP"

echo ""
echo "Listing all products..."
RESP=$(curl -s "$BASE/products")
check "List products returns array" "IPHONE-17" "$RESP"
echo "  → $RESP"

echo ""
echo "Updating Product 1 price to 949..."
RESP=$(curl -s -X PUT "$BASE/products/1" \
  -H "Content-Type: application/json" \
  -d '{"price":949.00}')
check "Update product price" "949" "$RESP"
echo "  → $RESP"

echo ""
echo "Testing duplicate SKU (should fail)..."
RESP=$(curl -s -X POST "$BASE/products" \
  -H "Content-Type: application/json" \
  -d '{"sku":"IPHONE-17","name":"Duplicate","price":100,"stock":1}')
check "Duplicate SKU rejected (400)" "already exists" "$RESP"
echo "  → $RESP"

# ──────────────────────────────────────────────
header "3. CUSTOMER CRUD"
# ──────────────────────────────────────────────

echo "Creating Customer 1 (John Doe)..."
RESP=$(curl -s -X POST "$BASE/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}')
check "Create Customer 1" '"name":"John Doe"' "$RESP"
echo "  → $RESP"

echo ""
echo "Creating Customer 2 (Jane Smith)..."
RESP=$(curl -s -X POST "$BASE/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com"}')
check "Create Customer 2" '"name":"Jane Smith"' "$RESP"
echo "  → $RESP"

echo ""
echo "Listing all customers..."
RESP=$(curl -s "$BASE/customers")
check "List customers returns array" "john@example.com" "$RESP"
echo "  → $RESP"

echo ""
echo "Testing duplicate email (should fail)..."
RESP=$(curl -s -X POST "$BASE/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Another John","email":"john@example.com"}')
check "Duplicate email rejected (400)" "already exists" "$RESP"
echo "  → $RESP"

# ──────────────────────────────────────────────
header "4. ORDER CREATION + INVENTORY VALIDATION"
# ──────────────────────────────────────────────

echo "Placing valid order: 3x iPhone 17 for John Doe..."
RESP=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"product_id":1,"quantity":3}')
check "Order created" '"status":"completed"' "$RESP"
echo "  → $RESP"

echo ""
echo "Checking stock was reduced (iPhone should be 2 now)..."
RESP=$(curl -s "$BASE/products/1")
check "Stock reduced to 2" '"stock":2' "$RESP"
echo "  → $RESP"

echo ""
echo "Testing INSUFFICIENT STOCK: ordering 5 but only 2 available..."
RESP=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":2,"product_id":1,"quantity":5}')
check "Insufficient stock rejected (400)" "Insufficient stock" "$RESP"
echo "  → $RESP"

echo ""
echo "Testing non-existent customer (should get 404)..."
RESP=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":999,"product_id":1,"quantity":1}')
check "Non-existent customer (404)" "not found" "$RESP"
echo "  → $RESP"

echo ""
echo "Testing non-existent product (should get 404)..."
RESP=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"product_id":999,"quantity":1}')
check "Non-existent product (404)" "not found" "$RESP"
echo "  → $RESP"

echo ""
echo "Listing all orders..."
RESP=$(curl -s "$BASE/orders")
check "List orders returns data" "completed" "$RESP"
echo "  → $RESP"

# ──────────────────────────────────────────────
header "5. DELETE GUARDS"
# ──────────────────────────────────────────────

echo "Trying to delete customer with orders (should fail)..."
RESP=$(curl -s -X DELETE "$BASE/customers/1")
check "Cannot delete customer with orders" "existing orders" "$RESP"
echo "  → $RESP"

echo ""
echo "Trying to delete product with orders (should fail)..."
RESP=$(curl -s -X DELETE "$BASE/products/1")
check "Cannot delete product with orders" "existing orders" "$RESP"
echo "  → $RESP"

# ──────────────────────────────────────────────
header "RESULTS"
# ──────────────────────────────────────────────
echo ""
echo -e "\033[1;32m  Passed: $PASS\033[0m"
echo -e "\033[1;31m  Failed: $FAIL\033[0m"
TOTAL=$((PASS+FAIL))
echo -e "  Total:  $TOTAL"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "\033[1;32m🎉 ALL TESTS PASSED!\033[0m"
else
    echo -e "\033[1;31m⚠️  Some tests failed. Check output above.\033[0m"
fi
echo ""
