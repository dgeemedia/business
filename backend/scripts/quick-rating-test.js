// ============================================================================
// QUICK RATING TEST
// backend/scripts/quick-rating-test.js
// ============================================================================

async function testRating() {
  const BASE_URL = 'http://localhost:5000/api';
  
  console.log('🧪 Quick Rating Test\n');
  
  // Test data from your eligible orders
  const testCases = [
    {
      productId: 4,
      productName: 'Bread & Beans',
      phone: '08065104250',
      rating: 5,
      comment: 'Absolutely delicious! Best Bread & Beans I\'ve ever had!'
    },
    {
      productId: 1,
      productName: 'Jollof Rice',
      phone: '08065104250',
      rating: 4,
      comment: 'Very tasty, will order again'
    }
  ];
  
  console.log('Testing 2 ratings...\n');
  
  for (const test of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${test.productName}`);
    console.log(`Phone: ${test.phone}`);
    console.log(`Rating: ${'⭐'.repeat(test.rating)}\n`);
    
    try {
      // Step 1: Check if can rate
      console.log('Step 1: Checking eligibility...');
      const checkResponse = await fetch(
        `${BASE_URL}/products/${test.productId}/can-rate?phone=${encodeURIComponent(test.phone)}`
      );
      const checkData = await checkResponse.json();
      
      console.log(`  Can rate: ${checkData.canRate ? '✅ YES' : '❌ NO'}`);
      console.log(`  Has rated: ${checkData.hasRated ? 'Yes' : 'No'}`);
      
      if (!checkData.canRate) {
        console.log('  ❌ Cannot rate this product!');
        continue;
      }
      
      // Step 2: Submit rating
      console.log('\nStep 2: Submitting rating...');
      const submitResponse = await fetch(
        `${BASE_URL}/products/${test.productId}/ratings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: test.phone,
            rating: test.rating,
            comment: test.comment
          })
        }
      );
      
      const submitData = await submitResponse.json();
      
      if (submitData.success) {
        console.log('  ✅ Rating submitted successfully!');
        console.log(`  Average rating: ${submitData.averageRating.toFixed(1)} ⭐`);
        console.log(`  Total ratings: ${submitData.totalRatings}`);
      } else {
        console.log('  ❌ Failed to submit rating');
        console.log(`  Error: ${submitData.error}`);
        if (submitData.debug) {
          console.log('  Debug info:', JSON.stringify(submitData.debug, null, 2));
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('\n✅ Test completed!\n');
  console.log('Check your backend console for detailed logs.');
  console.log('Now try rating from the frontend interface!');
}

testRating();