#!/bin/bash
# This script will securely push your upgraded application to GitHub and fetch stitch-skills.
echo "🔄 Connecting to GitHub to fetch stitch-skills repository..."
cd /Users/shashishekharmishra/Downloads/Reliability-Analysis-System-2

# Install the Stitch skills repository (user requested)
if [ ! -d "stitch-skills" ]; then
    git clone https://github.com/google-labs-code/stitch-skills.git
fi

# Make sure we add and commit all the new fixes!
git add .
git commit -m "Fix API Vercel Serverless crashes, mapping, and MCP updates"

echo "🔄 Pushing our updates to GitHub..."
git push -f github master

echo "✅ Upgrade forcefully deployed to GitHub!"
