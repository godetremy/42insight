import {NextRequest, NextResponse} from 'next/server'
import {getToken} from "next-auth/jwt";
import {rateLimit, getRateLimitHeaders} from "@/lib/rate-limit";
import {campusMapping} from "@/app/const/CampusMapping";

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ campus_name: string, project_id: string }> },
) {
    const token = await getToken({req: request});
    if (!token || !token.id || !token.accessToken) {
        return NextResponse.json(
            {error: 'Unauthorized'},
            {status: 401}
        )
    }

    const limitResult = await rateLimit(token.id as string);
    if (!limitResult.success) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: getRateLimitHeaders(limitResult),
        });
    }

    try {
        const {campus_name, project_id} = await params;
        const {searchParams} = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const campus_id = campusMapping[campus_name];
        if (!campus_id) {
            return NextResponse.json({error: "Campus not found"}, {status: 404});
        }

        const proxyResponse = await fetch(
            `https://api.intra.42.fr/v2/projects/${project_id}/slots?range[begin_at]=${from},${to}&filter[campus_id]=${campus_id}`,
            {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
            }
        )

        if (!proxyResponse.ok) {
            return NextResponse.json(
                {error: `42 API error: ${proxyResponse.status}`},
                {status: proxyResponse.status}
            )
        }

        const data = await proxyResponse.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            {error: 'Failed to fetch data from 42 API'},
            {status: 500}
        )
    }
}
