import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IDCard from '@/models/IDCard';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { username } = await params;
    console.log('Looking for ID card for username:', username);

    // Try to find ID card directly by username
    let idCard = await IDCard.findOne({ username });
    console.log('ID card found by username:', idCard ? 'Yes' : 'No');

    // If not found by username, try finding user first then lookup by email
    if (!idCard) {
      const user = await User.findOne({ username });
      console.log('User found:', user ? `Yes (email: ${user.email})` : 'No');
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Find ID card by email
      idCard = await IDCard.findOne({ email: user.email });
      console.log('ID card found by email:', idCard ? 'Yes' : 'No');
      
      // If found by email, update it with username for future lookups
      if (idCard && !idCard.username) {
        console.log('Updating ID card with username:', username);
        idCard.username = username;
        await idCard.save();
      }
    }

    if (!idCard) {
      return NextResponse.json(
        { error: 'ID card not found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      idCard 
    });

  } catch (error) {
    console.error('Error fetching ID card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ID card' },
      { status: 500 }
    );
  }
}
