#!/bin/bash

# Blue Carbon MRV System - Test Projects
# 3 Good Projects + 2 Bad Projects

echo "🌊 Blue Carbon MRV System - Project Testing Suite"
echo "=================================================="

# Good Project 1: Comprehensive Mangrove Restoration
echo ""
echo "=== 🌿 GOOD PROJECT 1: Comprehensive Mangrove Restoration ==="
curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Sundarbans Mangrove Restoration Initiative",
    "project_description": "Community-led restoration of 25 hectares of degraded mangrove forest in Sundarbans delta region with focus on Rhizophora and Avicennia species",
    "location": {
      "lat": 21.9497,
      "lng": 88.9468
    },
    "area_hectares": 25.0,
    "ecosystem_type": "mangrove",
    "estimated_carbon_credits": 180,
    "field_measurements": {
      "water_quality": {
        "ph_level": "7.9",
        "temperature": "26",
        "salinity": "22",
        "dissolved_oxygen": "7.2"
      },
      "soil_analysis": {
        "carbon_content": "6.8",
        "nitrogen_level": "1.2"
      },
      "biodiversity": {
        "species_count": "34",
        "vegetation_density": "85"
      }
    },
    "restoration_plan": {
      "objectives": "Restore degraded mangrove ecosystem, improve fish nursery habitat, provide coastal protection",
      "methods": "Community nursery development, direct seeding, transplantation of native species",
      "timeline": "5 years with monitoring for 10 years"
    },
    "community_involvement": {
      "stakeholders": "Local fishing communities, Sundarbans Development Board, WWF India",
      "benefits": "Improved fish catch, coastal protection, sustainable livelihood opportunities",
      "consultation": "Yes - 6 months of community consultations completed"
    },
    "contact_email": "sundarbans.project@restoration.org",
    "media_files": []
  }' | jq '.ai_analysis.overall_score, .ai_analysis.category, .status'

sleep 2

# Good Project 2: Seagrass Restoration  
echo ""
echo "=== 🌱 GOOD PROJECT 2: Seagrass Restoration ==="
curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Gulf of Mannar Seagrass Restoration",
    "project_description": "Restoration of degraded seagrass beds in Gulf of Mannar Marine National Park focusing on Thalassia hemprichii and Cymodocea serrulata",
    "location": {
      "lat": 9.1412,
      "lng": 79.0861
    },
    "area_hectares": 15.5,
    "ecosystem_type": "seagrass",
    "estimated_carbon_credits": 93,
    "field_measurements": {
      "water_quality": {
        "ph_level": "8.1",
        "temperature": "29",
        "salinity": "35",
        "dissolved_oxygen": "8.1"
      },
      "soil_analysis": {
        "carbon_content": "3.8",
        "nitrogen_level": "0.9"
      },
      "biodiversity": {
        "species_count": "42",
        "vegetation_density": "70"
      }
    },
    "restoration_plan": {
      "objectives": "Restore seagrass meadows for dugong habitat and carbon sequestration",
      "methods": "Transplantation, sediment stabilization, community-based monitoring",
      "timeline": "4 years implementation with 8 years monitoring"
    },
    "community_involvement": {
      "stakeholders": "Tamil Nadu Forest Department, local fishing cooperatives, Marine research institutes",
      "benefits": "Enhanced fish populations, dugong conservation, eco-tourism opportunities",
      "consultation": "Yes - extensive consultation with fishing communities"
    },
    "contact_email": "seagrass.restoration@tnfd.gov.in",
    "media_files": []
  }' | jq '.ai_analysis.overall_score, .ai_analysis.category, .status'

sleep 2

# Good Project 3: Salt Marsh Restoration
echo ""
echo "=== 🧂 GOOD PROJECT 3: Salt Marsh Restoration ==="
curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Chilika Lake Salt Marsh Conservation",
    "project_description": "Restoration of degraded salt marsh ecosystem in Chilika Lake with focus on Salicornia and Suaeda species for bird habitat and carbon sequestration",
    "location": {
      "lat": 19.7161,
      "lng": 85.3206
    },
    "area_hectares": 8.2,
    "ecosystem_type": "salt_marsh",
    "estimated_carbon_credits": 41,
    "field_measurements": {
      "water_quality": {
        "ph_level": "7.6",
        "temperature": "27",
        "salinity": "28",
        "dissolved_oxygen": "6.8"
      },
      "soil_analysis": {
        "carbon_content": "5.1",
        "nitrogen_level": "1.1"
      },
      "biodiversity": {
        "species_count": "28",
        "vegetation_density": "65"
      }
    },
    "restoration_plan": {
      "objectives": "Restore salt marsh for migratory bird habitat and coastal protection",
      "methods": "Direct seeding, soil stabilization, invasive species removal",
      "timeline": "3 years implementation with 5 years monitoring"
    },
    "community_involvement": {
      "stakeholders": "Odisha Forest Department, Local fishing communities, Chilika Development Authority",
      "benefits": "Bird conservation, sustainable fishing, eco-tourism revenue",
      "consultation": "Yes - community meetings and workshops conducted"
    },
    "contact_email": "chilika.saltmarsh@odishaforest.gov.in",
    "media_files": []
  }' | jq '.ai_analysis.overall_score, .ai_analysis.category, .status'

sleep 2

# Bad Project 1: Fake Data with Identical Values
echo ""
echo "=== ❌ BAD PROJECT 1: Fake Data (Identical Values) ==="
curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Fake Mangrove Project",
    "project_description": "Suspicious project with fabricated data",
    "location": {
      "lat": 19.0760,
      "lng": 72.8777
    },
    "area_hectares": 10.5,
    "ecosystem_type": "mangrove",
    "estimated_carbon_credits": 75,
    "field_measurements": {
      "water_quality": {
        "ph_level": "5",
        "temperature": "5",
        "salinity": "5",
        "dissolved_oxygen": "5"
      },
      "soil_analysis": {
        "carbon_content": "5",
        "nitrogen_level": "5"
      },
      "biodiversity": {
        "species_count": "5",
        "vegetation_density": "5"
      }
    },
    "restoration_plan": {
      "objectives": "Quick money",
      "methods": "Copy paste data",
      "timeline": "immediate"
    },
    "community_involvement": {
      "stakeholders": "None",
      "benefits": "None",
      "consultation": "No"
    },
    "contact_email": "fake@fake.com",
    "media_files": []
  }' | jq '.ai_analysis.overall_score, .ai_analysis.category, .status'

sleep 2

# Bad Project 2: Unrealistic Data and Poor Planning
echo ""
echo "=== ❌ BAD PROJECT 2: Unrealistic Data ==="
curl -X POST http://localhost:8002/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Impossible Restoration Project",
    "project_description": "Project with unrealistic claims and poor data",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "area_hectares": 1000.0,
    "ecosystem_type": "mangrove",
    "estimated_carbon_credits": 50000,
    "field_measurements": {
      "water_quality": {
        "ph_level": "2.1",
        "temperature": "60",
        "salinity": "100",
        "dissolved_oxygen": "0.1"
      },
      "soil_analysis": {
        "carbon_content": "99",
        "nitrogen_level": "50"
      },
      "biodiversity": {
        "species_count": "1000",
        "vegetation_density": "150"
      }
    },
    "restoration_plan": {
      "objectives": "Make millions from carbon credits overnight",
      "methods": "Magic restoration techniques",
      "timeline": "1 week"
    },
    "community_involvement": {
      "stakeholders": "Nobody consulted",
      "benefits": "All money goes to me",
      "consultation": "No consultation needed"
    },
    "contact_email": "scammer@badproject.com",
    "media_files": []
  }' | jq '.ai_analysis.overall_score, .ai_analysis.category, .status'

echo ""
echo "🏁 Testing Complete!"
echo "Expected Results:"
echo "✅ Good Projects: Score 80-90+, Category: excellent/good"
echo "❌ Bad Projects: Score <40, Category: poor"