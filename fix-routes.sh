#!/bin/bash

# Script to fix route names in frontend files

# Bank Account routes
find resources/js/pages/kas -name "*.tsx" -type f -exec sed -i 's/kas\.bank-account\./kas.bank-accounts./g' {} \;

# Cash Transaction routes  
find resources/js/pages/kas -name "*.tsx" -type f -exec sed -i 's/kas\.cash-transaction\./kas.cash-transactions./g' {} \;

# Bank Transaction routes
find resources/js/pages/kas -name "*.tsx" -type f -exec sed -i 's/kas\.bank-transaction\./kas.bank-transactions./g' {} \;

# Giro Transaction routes
find resources/js/pages/kas -name "*.tsx" -type f -exec sed -i 's/kas\.giro-transaction\./kas.giro-transactions./g' {} \;

echo "Route names fixed!"
