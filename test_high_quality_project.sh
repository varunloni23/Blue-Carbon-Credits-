#!/bin/bash

echo "🌊 Testing High-Quality Project for Blockchain Registration"
echo "========================================================="

echo "📡 Creating high-quality project with complete data..."

curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sundarbans Mangrove Conservation Initiative",
    "description": "Community-led mangrove restoration project in West Bengal Sundarbans with comprehensive monitoring, community participation, and scientific carbon sequestration methodology. Project includes 500 local families and aims to restore 50 hectares of degraded mangrove ecosystem.",
    "ecosystem_type": "mangrove",
    "location": "22.3511°N, 88.9870°E",
    "area_hectares": 50.0,
    "estimated_carbon_credits": 300,
    "project_name": "Sundarbans Mangrove Conservation Initiative",
    "project_description": "Comprehensive mangrove restoration with community engagement",
    "restoration_method": "Direct planting and natural regeneration of Rhizophora and Avicennia species",
    "community_details": "500 families from 5 villages participating in restoration activities",
    "contact_email": "sundarbans.conservation@example.org",
    "community_name": "Sundarbans Conservation Community",
    "community_members": 500,
    "state": "West Bengal",
    "district": "South 24 Parganas",
    "field_measurements": {
      "water_ph": "7.8",
      "salinity_ppt": "18.5",
      "temperature": "26.5",
      "dissolved_oxygen": "6.2",
      "turbidity": "12.0",
      "root_depth": "1.8",
      "canopy_cover": "78",
      "fish_species_count": "24",
      "sediment_accretion": "3.2",
      "seedling_survival_rate": "92"
    },
    "timeline": {
      "start_date": "2024-01-15",
      "expected_completion": "2026-12-31",
      "monitoring_duration": "10 years"
    },
    "funding": {
      "total_budget": 150000,
      "community_benefit_percentage": 40
    },
    "latitude": 22.3511,
    "longitude": 88.9870,
    "gps_coordinates": {
      "lat": 22.3511,
      "lng": 88.9870,
      "accuracy": "high"
    }
  }'

echo ""
echo "✅ High-quality project creation completed"
echo "Expected: AI score >85, automatic blockchain registration"