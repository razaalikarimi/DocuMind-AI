import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { connectToDatabase } from "@/lib/mongodb";
import { User, Workspace } from "@/lib/models";

type ClerkEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify Svix signature
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  await connectToDatabase();

  const { type, data } = event;

  if (type === "user.created") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;

    const user = await User.create({
      clerkId: data.id,
      email,
      name,
      avatar: data.image_url,
      plan: "free",
    });

    // Create default workspace
    await Workspace.create({
      userId: data.id,
      name: "My Workspace",
      description: "Your default workspace",
      color: "indigo",
      settings: {
        defaultModel: "gpt-4o",
        maxTokens: 2048,
        temperature: 0.7,
      },
    });

    console.log(`[Webhook] Created user: ${user._id} (${email})`);
  }

  if (type === "user.updated") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;

    await User.findOneAndUpdate(
      { clerkId: data.id },
      { email, name, avatar: data.image_url }
    );
  }

  if (type === "user.deleted") {
    await User.findOneAndDelete({ clerkId: data.id });
    console.log(`[Webhook] Deleted user: ${data.id}`);
  }

  return NextResponse.json({ success: true });
}
