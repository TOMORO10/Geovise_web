import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// CORS headers for direct testing from browser if needed
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Incoming Payload:", JSON.stringify(payload, null, 2))

    const { record } = payload
    if (!record) {
      throw new Error("No record found in payload")
    }

    const { full_name, company, email, product_of_interest, message } = record

    // Formatear el contenido del correo para el equipo Geovise
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #D4A017;">NUEVO LEAD: GEOVISE.IO</h2>
        <p>Has recibido un nuevo prospecto desde el formulario web:</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Nombre:</strong> ${full_name}</p>
        <p><strong>Empresa:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Producto de Interés:</strong> ${(product_of_interest || '').toUpperCase()}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message || 'Sin mensaje adicional.'}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">Este es un mensaje automático del sistema de Inteligencia de Geovise.</p>
      </div>
    `

    // --- 1. Internal Notification (To Geovise Team) ---
    console.log(`Sending internal notification for lead: ${full_name}`)
    
    const resInternal = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Geovise Notifications <notifications@resend.dev>',
        to: ['intel@geovise.io', 'tmojica85@gmail.com'],
        subject: `🚀 Nuevo Lead: ${full_name} (${company})`,
        html: emailHtml,
      }),
    })

    const internalData = await resInternal.json()
    console.log("Resend Internal Response Status:", resInternal.status)
    console.log("Resend Internal Response Data:", JSON.stringify(internalData, null, 2))

    // --- 2. Prospect Auto-Response ---
    
    // REEMPLAZAR ESTE ENLACE CON TU LINK REAL DE DOCSEND
    const DOCSEND_LINK = "https://docsend.com/view/YOUR_LINK_HERE"; 
    
    let prospectData = null
    let resProspectStatus = 0

    if (email) {
      console.log(`Sending auto-response to prospect: ${email}`)
      
      const prospectEmailHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; color: #333; padding: 20px;">
          <h2 style="color: #0d1b2a;">Your Geovise Intelligence Report</h2>
          <p>Hi ${full_name.split(' ')[0]},</p>
          <p>Thanks for requesting your free sample report. At Geovise, we process over 409,000 CPUC records and analyze hundreds of ZIP codes to find the best solar and storage opportunities in California.</p>
          <p>You can view your requested intelligence report securely via the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${DOCSEND_LINK}?email=${encodeURIComponent(email)}" style="background-color: #D4A017; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              View Sample Report
            </a>
          </div>
          
          <p>This link is trackable and unique to you. If you'd like to dive deeper into the data or request a full ZIP-level pipeline analysis, let's schedule a call.</p>
          <p>Best regards,<br><strong>The Geovise Team</strong><br><a href="https://geovise.io" style="color: #D4A017;">geovise.io</a></p>
        </div>
      `

      const resProspect = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Geovise Team <notifications@resend.dev>',
          to: [email],
          reply_to: 'intel@geovise.io',
          subject: `Your Geovise Intelligence Report`,
          html: prospectEmailHtml,
        }),
      })

      resProspectStatus = resProspect.status
      prospectData = await resProspect.json()
      console.log("Resend Prospect Response Status:", resProspectStatus)
      console.log("Resend Prospect Response Data:", JSON.stringify(prospectData, null, 2))
    }

    return new Response(JSON.stringify({ 
      success: true, 
      internal: internalData, 
      prospect: prospectData 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error: any) {
    console.error("Critical Error in Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
