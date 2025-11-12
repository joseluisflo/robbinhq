import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function GET() {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to retrieve access token.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ token: accessToken });

  } catch (error: any) {
    console.error('Failed to generate Google Cloud access token:', error);
    // This could be due to missing GOOGLE_APPLICATION_CREDENTIALS in the server environment
    return NextResponse.json(
      { error: 'Failed to generate access token.', details: error.message },
      { status: 500 }
    );
  }
}
