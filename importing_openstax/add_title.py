import os

# Define the directory containing .qmd files
base_dir = "C:\\Users\\lifengren\\Teaching\\open_principles_of_microeconomics\\open_principles_of_microeconomics_dev"
code_dir = os.path.join(base_dir, "open_principles_of_microeconomics")


# List of parts and corresponding chapters
parts = [
    "1-Welcome to Economics!",
    "2-Choice in a World of Scarcity",
    "3-Demand and Supply",
    "4-Labor and Financial Markets",
    "5-Elasticity",
    "6-Consumer Choices",
    "7-Production, Costs, and Industry Structure",
    "8-Perfect Competition",
    "9-Monopoly",
    "10-Monopolistic Competition and Oligopoly",
    "11-Monopoly and Antitrust Policy",
    "12-Environmental Protection and Negative Externalities",
    "13-Positive Externalities and Public Goods",
    "14-Labor Markets and Income",
    "15-Poverty and Economic Inequality",
    "16-Information, Risk, and Insurance",
    "17-Financial Markets",
    "18-Public Economy",
    "19-International Trade",
    "20-Globalization and Protectionism"
]

# Function to add title to the .qmd content
def add_title_to_qmd(chapter_num):
    chapter_file = f"chapter{chapter_num}.qmd"
    file_path = os.path.join(code_dir, chapter_file)
    
    # Ensure the file exists
    if not os.path.exists(file_path):
        print(f"No file found for Chapter {chapter_num}")
        return
    
    # Read the existing content of the file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.readlines()

    # Extract the part name from the parts list using chapter number
    # Assuming chapter numbers and part indices align correctly
    part_name = next((part for part in parts if part.startswith(str(chapter_num))), None)
    if not part_name:
        print(f"No part name found for Chapter {chapter_num}")
        return

    # Add the title line at the beginning of the content
    title_line = f"# Chapter {chapter_num} - {part_name.split('-', 1)[1]}\n"
    content.insert(0, title_line)

    # Write back the modified content
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(content)

    print(f"Added title to Chapter {chapter_num}")

# Apply the function to each chapter
for chapter_num in range(1, 21):  # Assuming chapters 1 to 20
    add_title_to_qmd(chapter_num)
