import { redirect } from 'next/navigation'

export async function GET() {
  // Instagram uses the same Facebook OAuth flow — redirect to Facebook connect
  // which includes Instagram permissions in the scope
  redirect('/api/integrations/facebook/connect?include_instagram=true')
}
