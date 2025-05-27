/**
 * Clean AI Analysis Service - Built Around URL Hash Data
 * No database dependencies - works directly with vehicle data from URL hash
 */

interface VehicleData {
  platform: string;
  lotId: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  series?: string;
  mileage: string;
  damage: string;
  color?: string;
  location?: string;
  currentBid?: string;
  auctionDate?: string;
  images: string[];
}

interface AIAnalysisRequest {
  platform: string;
  lotId: string;
  vin: string;
  currentBid?: string;
  customPrompt?: string;
  vehicleData: VehicleData;
}

export async function performAIAnalysis(request: AIAnalysisRequest) {
  const { platform, lotId, vin, currentBid, customPrompt, vehicleData } = request;

  console.log(`🤖 AI Analysis Request: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}, VIN: ${vin}`);

  // Build comprehensive AI prompt using URL hash data
  const aiPrompt = `You are an expert vehicle auction analyst specializing in Central America export markets. Analyze this vehicle data and provide comprehensive insights:

VEHICLE DETAILS:
- ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.series || ''}
- VIN: ${vin}
- Mileage: ${vehicleData.mileage?.toLocaleString()} miles
- Primary Damage: ${vehicleData.damage}
- Color: ${vehicleData.color || 'Unknown'}
- Location: ${vehicleData.location || 'Unknown'}
- Platform: ${platform.toUpperCase()}
- Lot ID: ${lotId}
- Current Bid: $${currentBid || 'Unknown'}
- Auction Date: ${vehicleData.auctionDate || 'Unknown'}

Provide analysis in JSON format with these exact fields:
{
  "vehicleAssessment": {
    "overallCondition": "Professional assessment of vehicle condition",
    "damageAnalysis": "Detailed damage assessment based on images and description",
    "repairCostEstimate": "Detailed cost breakdown with specific dollar amounts",
    "marketValue": "Estimated market value range with specific dollar amounts"
  },
  "biddingRecommendation": {
    "recommendation": "BUY/CAUTION/PASS",
    "maxBidAmount": "Specific dollar amount (e.g., $8,500)",
    "reasoning": "Detailed explanation of recommendation with specific factors",
    "profitPotential": "Export profit analysis for Central America markets with percentages"
  },
  "exportAnalysis": {
    "exportViability": "Assessment for Central America export with specific reasoning",
    "targetMarkets": "Specific countries/regions recommended (e.g., Honduras, Guatemala)",
    "transportationCosts": "Estimated shipping costs with dollar amounts",
    "potentialProfit": "Estimated profit margin percentage and dollar amounts"
  },
  "riskAssessment": {
    "overallRisk": "LOW/MEDIUM/HIGH",
    "riskFactors": ["Specific risk factors identified"],
    "mitigationStrategies": ["Specific ways to reduce risks"]
  }
}

${customPrompt ? `CUSTOM ANALYSIS REQUEST: ${customPrompt}` : ''}

Focus on actionable insights for auction bidding and export profitability. Be specific with dollar amounts and percentages.`;

  // Prepare image analysis for OpenAI Vision
  const imageAnalysisPrompts = vehicleData.images.map((imageUrl: string) => ({
    type: "image_url" as const,
    image_url: { url: imageUrl }
  }));

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: aiPrompt
          },
          {
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analyze these vehicle images and provide comprehensive auction intelligence:"
              },
              ...imageAnalysisPrompts
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const aiAnalysis = await openaiResponse.json();
    
    console.log('✅ AI Analysis completed successfully');
    
    return {
      success: true,
      data: JSON.parse(aiAnalysis.choices[0].message.content),
      vehicleData: {
        platform,
        lotId,
        vin,
        currentBid,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        damage: vehicleData.damage,
        mileage: vehicleData.mileage,
        imageCount: vehicleData.images.length
      }
    };

  } catch (error: any) {
    console.error('AI Analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}