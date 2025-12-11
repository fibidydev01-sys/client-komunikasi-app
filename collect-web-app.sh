#!/bin/bash

# Script untuk mengumpulkan semua file dari folder chat-app/web
# Output: web-collection.txt

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ✅ FIX: Path untuk Git Bash di Windows
BASE_PATH="/d/READY-TO-SHIP/project/CHAT-APP/web"
OUTPUT_FILE="web-collection.txt"

echo -e "${BLUE}=== Collecting Chat App Web Files ===${NC}"
echo "Base Path: $BASE_PATH"
echo "Output File: $OUTPUT_FILE"
echo ""

# Cek apakah direktori ada
if [ ! -d "$BASE_PATH" ]; then
    echo -e "${RED}ERROR: Directory $BASE_PATH not found!${NC}"
    echo -e "${YELLOW}Trying alternative paths...${NC}"
    
    # Try alternative paths
    if [ -d "/d/READY-TO-SHIP/CHAT-APP/web" ]; then
        BASE_PATH="/d/READY-TO-SHIP/CHAT-APP/web"
        echo -e "${GREEN}Found at: $BASE_PATH${NC}"
    elif [ -d "./web" ]; then
        BASE_PATH="./web"
        echo -e "${GREEN}Found at: $BASE_PATH${NC}"
    elif [ -d "." ] && [ -f "./package.json" ]; then
        BASE_PATH="."
        echo -e "${GREEN}Using current directory${NC}"
    else
        echo -e "${RED}Cannot find web directory!${NC}"
        exit 1
    fi
fi

# Hapus file output lama jika ada
rm -f "$OUTPUT_FILE"

# Header
cat > "$OUTPUT_FILE" << EOF
================================================
CHAT APP WEB FILES COLLECTION
Generated: $(date)
Base Path: $BASE_PATH
================================================

EOF

# Counter untuk statistik
file_count=0
skipped_count=0

# Function untuk memproses file
process_file() {
    local file="$1"
    local relative_path="${file#$BASE_PATH/}"
    
    # Remove leading ./ if exists
    relative_path="${relative_path#./}"
    
    echo -e "${GREEN}✓ Processing: $relative_path${NC}"
    
    cat >> "$OUTPUT_FILE" << EOF
================================================
FILE: $relative_path
================================================

EOF
    
    cat "$file" >> "$OUTPUT_FILE"
    
    cat >> "$OUTPUT_FILE" << EOF


EOF
    
    ((file_count++))
}

# Function untuk cek apakah folder harus diskip
should_skip_directory() {
    local dir_path="$1"
    local dir_name=$(basename "$dir_path")
    
    # Skip folders
    case "$dir_name" in
        node_modules|.next|dist|build|.git|coverage|.cache)
            return 0
            ;;
    esac
    
    # Skip UI components folder
    if [[ "$dir_path" == *"/src/shared/components/ui"* ]]; then
        return 0
    fi
    
    # Skip assets folders
    if [[ "$dir_path" == *"/src/assets/fonts"* ]] || \
       [[ "$dir_path" == *"/src/assets/icons"* ]] || \
       [[ "$dir_path" == *"/src/assets/images"* ]]; then
        return 0
    fi
    
    return 1
}

# Function untuk memproses folder secara rekursif
process_directory() {
    local dir="$1"
    
    # Check if should skip
    if should_skip_directory "$dir"; then
        local relative_dir="${dir#$BASE_PATH/}"
        relative_dir="${relative_dir#./}"
        echo -e "${YELLOW}⊘ Skipping: $relative_dir${NC}"
        ((skipped_count++))
        return
    fi
    
    # Proses file dengan ekstensi yang diinginkan
    for file in "$dir"/*.{ts,tsx,css,json}; do
        # Check if file exists (handle no match case)
        [ -e "$file" ] || continue
        
        local filename=$(basename "$file")
        
        # Skip files
        case "$filename" in
            package-lock.json|pnpm-lock.yaml|yarn.lock|tsconfig.tsbuildinfo)
                continue
                ;;
        esac
        
        process_file "$file"
    done
    
    # Rekursif ke subfolder
    for subdir in "$dir"/*; do
        [ -d "$subdir" ] || continue
        process_directory "$subdir"
    done
}

echo -e "${YELLOW}Collecting src files...${NC}"
echo ""

# Proses folder src
if [ -d "$BASE_PATH/src" ]; then
    process_directory "$BASE_PATH/src"
else
    echo -e "${RED}WARNING: src folder not found!${NC}"
fi

# Proses config files di root
echo ""
echo -e "${YELLOW}Collecting root config files...${NC}"

for file in package.json tsconfig.json tsconfig.node.json vite.config.ts \
            tailwind.config.js eslint.config.js components.json .env.example; do
    if [ -f "$BASE_PATH/$file" ]; then
        process_file "$BASE_PATH/$file"
    fi
done

# Proses index.html
if [ -f "$BASE_PATH/index.html" ]; then
    process_file "$BASE_PATH/index.html"
fi

# Footer dengan statistik
cat >> "$OUTPUT_FILE" << EOF
================================================
COLLECTION SUMMARY
================================================
Total files collected: $file_count
Total folders skipped: $skipped_count
Completed at: $(date)
================================================
EOF

echo ""
echo -e "${GREEN}✓ Collection completed!${NC}"
echo ""
echo -e "📁 Output saved to: ${BLUE}$OUTPUT_FILE${NC}"
echo -e "📊 Total files collected: ${YELLOW}$file_count${NC}"
echo -e "⊘ Total folders skipped: ${YELLOW}$skipped_count${NC}"

# Tampilkan ukuran file dan jumlah baris
if [ -f "$OUTPUT_FILE" ]; then
    total_lines=$(wc -l < "$OUTPUT_FILE" 2>/dev/null || echo "0")
    file_size=$(du -h "$OUTPUT_FILE" 2>/dev/null | cut -f1 || echo "0")
    echo -e "📄 Total lines: ${YELLOW}$total_lines${NC}"
    echo -e "💾 File size: ${YELLOW}$file_size${NC}"
fi

echo ""
echo -e "${GREEN}Done! 🎉${NC}"