#!/bin/bash

# Script untuk mengumpulkan semua file dari folder chat-app/web
# Output: web-collection.txt

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Path base
BASE_PATH="d:/READY-TO-SHIP/CHAT-APP/web"
OUTPUT_FILE="web-collection.txt"

echo -e "${BLUE}=== Collecting Chat App Web Files ===${NC}"
echo "Base Path: $BASE_PATH"
echo "Output File: $OUTPUT_FILE"
echo ""

# Hapus file output lama jika ada
rm -f "$OUTPUT_FILE"

# Header
echo "================================================" >> "$OUTPUT_FILE"
echo "CHAT APP WEB FILES COLLECTION" >> "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "Base Path: $BASE_PATH" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Counter untuk statistik
file_count=0

# Function untuk memproses file
process_file() {
    local file=$1
    local relative_path=${file#$BASE_PATH/}
    
    echo -e "${GREEN}Processing: $relative_path${NC}"
    
    echo "================================================" >> "$OUTPUT_FILE"
    echo "FILE: $relative_path" >> "$OUTPUT_FILE"
    echo "================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    cat "$file" >> "$OUTPUT_FILE"
    
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    ((file_count++))
}

# Function untuk memproses folder secara rekursif
process_directory() {
    local dir=$1
    local relative_dir=${dir#$BASE_PATH/}
    
    # Skip folders yang tidak perlu
    case "$relative_dir" in
        "node_modules"*|".next"*|"dist"*|"build"*|".git"*)
            echo -e "${YELLOW}Skipping: $relative_dir${NC}"
            return
            ;;
        "src/shared/components/ui"*)
            echo -e "${YELLOW}Skipping: $relative_dir (shadcn/ui components)${NC}"
            return
            ;;
        "src/assets/fonts"*|"src/assets/icons"*|"src/assets/images"*)
            echo -e "${YELLOW}Skipping: $relative_dir (assets)${NC}"
            return
            ;;
    esac
    
    # Proses semua file .ts, .tsx, .css, .json di folder
    for ext in ts tsx css json; do
        for file in "$dir"/*.$ext; do
            if [ -f "$file" ]; then
                local filename=$(basename "$file")
                # Skip beberapa file yang tidak perlu
                if [[ ! "$filename" =~ ^(package-lock|pnpm-lock|tsconfig\.tsbuildinfo)\.* ]]; then
                    process_file "$file"
                fi
            fi
        done
    done
    
    # Rekursif ke subfolder
    for subdir in "$dir"/*; do
        if [ -d "$subdir" ]; then
            local dirname=$(basename "$subdir")
            # Skip folder yang tidak perlu
            if [[ "$dirname" != "node_modules" && "$dirname" != ".next" && "$dirname" != "dist" && "$dirname" != "build" && "$dirname" != ".git" ]]; then
                process_directory "$subdir"
            fi
        fi
    done
}

# Cek apakah direktori ada
if [ ! -d "$BASE_PATH" ]; then
    echo -e "${RED}ERROR: Directory $BASE_PATH not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}Collecting src files...${NC}"

# Proses folder src
if [ -d "$BASE_PATH/src" ]; then
    process_directory "$BASE_PATH/src"
else
    echo -e "${RED}WARNING: src folder not found!${NC}"
fi

# Proses config files di root
echo -e "${YELLOW}Collecting root config files...${NC}"
for file in "$BASE_PATH"/{package.json,tsconfig*.json,vite.config.ts,tailwind.config.js,eslint.config.js,components.json,.env.example}; do
    [ -f "$file" ] && process_file "$file"
done

# Proses index.html
if [ -f "$BASE_PATH/index.html" ]; then
    process_file "$BASE_PATH/index.html"
fi

# Footer dengan statistik
echo "================================================" >> "$OUTPUT_FILE"
echo "COLLECTION SUMMARY" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"
echo "Total files collected: $file_count" >> "$OUTPUT_FILE"
echo "Completed at: $(date)" >> "$OUTPUT_FILE"
echo "================================================" >> "$OUTPUT_FILE"

echo ""
echo -e "${GREEN}✓ Collection completed!${NC}"
echo -e "Output saved to: ${BLUE}$OUTPUT_FILE${NC}"
echo -e "Total files collected: ${YELLOW}$file_count${NC}"

# Tampilkan ukuran file dan jumlah baris
if [ -f "$OUTPUT_FILE" ]; then
    total_lines=$(wc -l < "$OUTPUT_FILE")
    file_size=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "Total lines: ${YELLOW}$total_lines${NC}"
    echo -e "File size: ${YELLOW}$file_size${NC}"
fi