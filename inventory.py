# # #!/usr/bin/env python3
# # """
# # This script reads medicine inventory data from an ODS file and updates a MongoDB Atlas database.
# # The script handles medicine entries with the same medicine_id by grouping them under the same document.
# # """

# # import os
# # import sys
# # import pyexcel_ods
# # import pymongo
# # from pymongo import MongoClient
# # from datetime import datetime
# # import re
# # from dateutil import parser
# # import traceback

# # # MongoDB Atlas connection details
# # CONNECTION_STRING = "mongodb+srv://s25dassteam24:EcI2NdEIA0a95sd2@team-24.km4p9.mongodb.net/?retryWrites=true&w=majority&appName=team-24"  # Replace with your connection string
# # DB_NAME = "test"
# # COLLECTION_NAME = "inventories"

# # def parse_expiry_date(date_str):
# #     """Convert expiry date string to datetime object"""
# #     try:
# #         # Parse date formats like "Feb 2026", "Jan 2027" etc.
# #         return parser.parse(date_str)
# #     except:
# #         print(f"Warning: Could not parse date '{date_str}', using current date instead")
# #         return datetime.now()

# # def normalize_ods_data(filepath):
# #     """Read and normalize ODS file data to match MongoDB schema"""
# #     try:
# #         # Read ODS file
# #         print(f"Reading ODS file: {filepath}")
# #         data = pyexcel_ods.get_data(filepath)
        
# #         # Get the first sheet (assuming it contains medicine data)
# #         sheet_name = list(data.keys())[0]
# #         rows = data[sheet_name]
        
# #         # Debug: Print first few rows to understand structure
# #         print(f"First row (header): {rows[0] if rows else 'No rows found'}")
# #         if len(rows) > 1:
# #             print(f"Second row (first data row): {rows[1]}")
        
# #         # Skip the header row - make sure to start from index 1 (second row)
# #         data_rows = rows[1:] if len(rows) > 0 else []
        
# #         # Group medicines by medicine_id
# #         medicine_map = {}
# #         current_medicine_id = None
        
# #         # Process each row
# #         for row in data_rows:
# #             # Ensure row has enough elements and is not empty
# #             if len(row) < 4:
# #                 print(f"Skipping row with insufficient data: {row}")
# #                 continue
                
# #             # Debug: Print the row
# #             print(f"Processing row: {row}")
                
# #             # Extract row data (column indexes from ODS file structure)
# #             row_medicine_id = str(row[0]) if len(row) > 0 and row[0] != '' else None
# #             medicine_name = str(row[1]) if len(row) > 1 else None
# #             medicine_formulation = str(row[2]) if len(row) > 2 else None
            
# #             # Handle quantity - safely convert to integer
# #             try:
# #                 if len(row) > 3 and row[3] != '':
# #                     quantity = int(float(str(row[3]).strip()))
# #                 else:
# #                     print(f"Skipping row with medicine '{medicine_name}' - missing quantity value")
# #                     continue  # Skip this row entirely
# #             except (ValueError, TypeError):
# #                 print(f"Skipping row with medicine '{medicine_name}' - invalid quantity value '{row[3]}'")
# #                 continue  # Skip this row entirely
                
# #             expiry_date = str(row[4]) if len(row) > 4 and row[4] != '' else None
            
# #             # Handle total quantity - safely convert to integer
# #             try:
# #                 total_quantity = int(float(str(row[6]).strip())) if len(row) > 6 and row[6] != '' else None
# #             except (ValueError, TypeError):
# #                 print(f"Warning: Invalid total quantity value '{row[6]}' for medicine ID '{row_medicine_id}', using None")
# #                 total_quantity = None
            
# #             # Update current medicine ID if available
# #             if row_medicine_id and row_medicine_id != current_medicine_id:
# #                 current_medicine_id = row_medicine_id
            
# #             # Skip if we don't have a medicine ID to work with
# #             if not current_medicine_id or not medicine_name or not medicine_formulation:
# #                 continue
            
# #             # Create or update the entry in the map
# #             if current_medicine_id not in medicine_map:
# #                 medicine_map[current_medicine_id] = {
# #                     "medicine_id": current_medicine_id,
# #                     "medicine_formulation": medicine_formulation,
# #                     "total_quantity": total_quantity if total_quantity is not None else 0,
# #                     "medicine_details": []
# #                 }
            
# #             # Add this medicine detail to the entry
# #             if medicine_name and expiry_date:
# #                 medicine_map[current_medicine_id]["medicine_details"].append({
# #                     "medicine_name": medicine_name,
# #                     "expiry_date": parse_expiry_date(expiry_date),
# #                     "quantity": quantity
# #                 })
        
# #         # Convert the map to a list of documents
# #         normalized_data = list(medicine_map.values())
        
# #         # Make sure total_quantity is the sum of quantities if not provided
# #         for medicine in normalized_data:
# #             if not medicine["total_quantity"]:
# #                 medicine["total_quantity"] = sum(detail["quantity"] for detail in medicine["medicine_details"])
        
# #         print(f"Normalized {len(normalized_data)} medicine entries")
# #         return normalized_data
        
# #     except Exception as e:
# #         print(f"Error normalizing ODS data: {e}")
# #         print("Traceback:")
# #         traceback.print_exc()
# #         return []

# # def update_mongodb(data):
# #     """Update MongoDB Atlas database with normalized medicine data"""
# #     try:
# #         # Connect to MongoDB Atlas
# #         print(f"Connecting to MongoDB Atlas...")
# #         client = MongoClient(CONNECTION_STRING)
# #         db = client[DB_NAME]
# #         collection = db[COLLECTION_NAME]
        
# #         # Track results
# #         inserted_count = 0
# #         updated_count = 0
# #         error_count = 0
        
# #         # Process each medicine entry
# #         for medicine in data:
# #             try:
# #                 # Check if document with this medicine_id already exists
# #                 existing_doc = collection.find_one({"medicine_id": medicine["medicine_id"]})
                
# #                 if existing_doc:
# #                     # Update existing document
# #                     result = collection.update_one(
# #                         {"medicine_id": medicine["medicine_id"]},
# #                         {"$set": {
# #                             "medicine_formulation": medicine["medicine_formulation"],
# #                             "total_quantity": medicine["total_quantity"],
# #                             "medicine_details": medicine["medicine_details"]
# #                         }}
# #                     )
# #                     if result.modified_count > 0:
# #                         updated_count += 1
# #                 else:
# #                     # Insert new document
# #                     result = collection.insert_one(medicine)
# #                     if result.inserted_id:
# #                         inserted_count += 1
            
# #             except Exception as e:
# #                 print(f"Error processing medicine ID {medicine['medicine_id']}: {e}")
# #                 error_count += 1
        
# #         # Print summary
# #         print(f"\nMongoDB Update Summary:")
# #         print(f"  Inserted: {inserted_count}")
# #         print(f"  Updated: {updated_count}")
# #         print(f"  Errors: {error_count}")
# #         print(f"  Total Processed: {len(data)}")
        
# #     except Exception as e:
# #         print(f"MongoDB connection error: {e}")

# # def main():
# #     # Check command line arguments
# #     if len(sys.argv) < 2:
# #         print(f"Usage: {sys.argv[0]} <path_to_ods_file>")
# #         sys.exit(1)
    
# #     filepath = sys.argv[1]
    
# #     # Check if file exists
# #     if not os.path.exists(filepath):
# #         print(f"Error: File not found - {filepath}")
# #         sys.exit(1)
    
# #     # Process ODS file and update MongoDB
# #     data = normalize_ods_data(filepath)
# #     if data:
# #         update_mongodb(data)
# #     else:
# #         print("No data to update")

# # if __name__ == "__main__":
# #     main()
# #!/usr/bin/env python3

"""
This script reads medicine inventory data from an ODS file and updates a MongoDB Atlas database.
It handles rows with category names of the format 'string1 - string2' and groups medicines under those categories.
"""

import os
import sys
import pyexcel_ods
import pymongo
from pymongo import MongoClient
from datetime import datetime
from dateutil import parser
import traceback
import re

# MongoDB Atlas connection details
CONNECTION_STRING = "mongodb+srv://s25dassteam24:EcI2NdEIA0a95sd2@team-24.km4p9.mongodb.net/?retryWrites=true&w=majority&appName=team-24"  # Replace with your connection string
DB_NAME = "test"
COLLECTION_NAME = "inventories"
CATEGORY_COLLECTION = "medicinecategories"

def parse_expiry_date(date_str):
    """Convert expiry date string to YYYY-MM format string"""
    try:
        parsed_date = parser.parse(date_str)
        return f"{parsed_date.year}-{parsed_date.month:02d}"
    except:
        print(f"Warning: Could not parse date '{date_str}', using current date instead")
        now = datetime.now()
        return f"{now.year}-{now.month:02d}"

def normalize_ods_data(filepath):
    """Read and normalize ODS file data to match MongoDB schema"""
    try:
        print(f"Reading ODS file: {filepath}")
        data = pyexcel_ods.get_data(filepath)
        
        # Get the first sheet (assuming it contains medicine data)
        sheet_name = list(data.keys())[0]
        rows = data[sheet_name]
        
        print(f"First row (header): {rows[0] if rows else 'No rows found'}")
        if len(rows) > 1:
            print(f"Second row (first data row): {rows[1]}")
        
        data_rows = rows[0:] if len(rows) > 0 else []
        
        medicine_map = {}
        category_map = {}
        current_category = None
        current_medicine_id = None
        
        # Regex to detect category rows (e.g., "string1 - string2")
        category_pattern = re.compile(r".+\s-\s.+")
        
        for row in data_rows:
            # Check if the row contains a category name in the third column
            if len(row) >= 3 and isinstance(row[2], str) and category_pattern.match(row[2]):
                current_category = row[2].split(" - ")[1].strip()  # Extract category name (string2)
                print(f"Detected category: {current_category}")
                continue
            
            # Skip rows with insufficient data
            if len(row) < 5:
                print(f"Skipping row with insufficient data: {row}")
                continue
                
            row_medicine_id = str(row[0]) if len(row) > 0 and row[0] != '' else None
            medicine_name = str(row[1]) if len(row) > 1 else None
            medicine_formulation = str(row[2]) if len(row) > 2 else None
            
            try:
                if len(row) > 3 and row[3] != '':
                    quantity = int(float(str(row[3]).strip()))
                else:
                    print(f"Skipping row with medicine '{medicine_name}' - missing quantity value")
                    continue
            except (ValueError, TypeError):
                print(f"Skipping row with medicine '{medicine_name}' - invalid quantity value '{row[3]}'")
                continue
                
            expiry_date = str(row[4]) if len(row) > 4 and row[4] != '' else None
            
            try:
                total_quantity = int(float(str(row[6]).strip())) if len(row) > 6 and row[6] != '' else None
            except (ValueError, TypeError):
                print(f"Warning: Invalid total quantity value '{row[6]}' for medicine ID '{row_medicine_id}', using None")
                total_quantity = None
            
            if row_medicine_id and row_medicine_id != current_medicine_id:
                current_medicine_id = row_medicine_id
            
            if not current_medicine_id or not medicine_name or not medicine_formulation:
                continue
            
            if current_medicine_id not in medicine_map:
                medicine_map[current_medicine_id] = {
                    "medicine_id": current_medicine_id,
                    "medicine_formulation": medicine_formulation,
                    "total_quantity": total_quantity if total_quantity is not None else 0,
                    "medicine_details": []
                }
            
            if medicine_name and expiry_date:
                medicine_map[current_medicine_id]["medicine_details"].append({
                    "medicine_name": medicine_name,
                    "expiry_date": parse_expiry_date(expiry_date),
                    "quantity": quantity
                })
            
            if current_category:
                if current_category not in category_map:
                    category_map[current_category] = set()
                category_map[current_category].add(current_medicine_id)
        
        normalized_data = list(medicine_map.values())
        
        for medicine in normalized_data:
            if not medicine["total_quantity"]:
                medicine["total_quantity"] = sum(detail["quantity"] for detail in medicine["medicine_details"])
        
        print(f"Normalized {len(normalized_data)} medicine entries")
        return normalized_data, category_map
        
    except Exception as e:
        print(f"Error normalizing ODS data: {e}")
        print("Traceback:")
        traceback.print_exc()
        return [], {}

def update_mongodb(data, category_map):
    """Update MongoDB Atlas database with normalized medicine data and categories"""
    try:
        print(f"Connecting to MongoDB Atlas...")
        client = MongoClient(CONNECTION_STRING)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        category_collection = db[CATEGORY_COLLECTION]
        
        inserted_count = 0
        updated_count = 0
        error_count = 0
        
        for medicine in data:
            try:
                existing_doc = collection.find_one({"medicine_id": medicine["medicine_id"]})
                
                if existing_doc:
                    result = collection.update_one(
                        {"medicine_id": medicine["medicine_id"]},
                        {"$set": {
                            "medicine_formulation": medicine["medicine_formulation"],
                            "total_quantity": medicine["total_quantity"],
                            "medicine_details": medicine["medicine_details"]
                        }}
                    )
                    if result.modified_count > 0:
                        updated_count += 1
                else:
                    result = collection.insert_one(medicine)
                    if result.inserted_id:
                        inserted_count += 1
            
            except Exception as e:
                print(f"Error processing medicine ID {medicine['medicine_id']}: {e}")
                error_count += 1
        
        for category, medicine_ids in category_map.items():
            try:
                existing_category = category_collection.find_one({"category_name": category})
                
                if existing_category:
                    category_collection.update_one(
                        {"category_name": category},
                        {"$addToSet": {"medicine_array": {"$each": list(medicine_ids)}}}
                    )
                else:
                    category_collection.insert_one({
                        "category_name": category,
                        "medicine_array": list(medicine_ids)
                    })
            except Exception as e:
                print(f"Error updating category '{category}': {e}")
        
        print(f"\nMongoDB Update Summary:")
        print(f"  Inserted: {inserted_count}")
        print(f"  Updated: {updated_count}")
        print(f"  Errors: {error_count}")
        print(f"  Total Processed: {len(data)}")
        
    except Exception as e:
        print(f"MongoDB connection error: {e}")

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path_to_ods_file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not os.path.exists(filepath):
        print(f"Error: File not found - {filepath}")
        sys.exit(1)
    
    data, category_map = normalize_ods_data(filepath)
    if data:
        update_mongodb(data, category_map)
    else:
        print("No data to update")

if __name__ == "__main__":
    main()