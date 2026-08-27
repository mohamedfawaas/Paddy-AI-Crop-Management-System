package com.paddyai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Reset your Paddy AI password");
            helper.setText(buildHtml(userName, resetLink), true);
            mailSender.send(message);
        } catch (Exception e) {
            // Don't leak SMTP errors to the client response — but log clearly so it's
            // visible in the terminal for debugging (e.g. wrong App Password, SMTP blocked).
            System.err.println("=".repeat(60));
            System.err.println("FAILED TO SEND PASSWORD RESET EMAIL to " + toEmail);
            System.err.println("Reason: " + e.getMessage());
            System.err.println("Check spring.mail.username / spring.mail.password in application.properties");
            System.err.println("=".repeat(60));
            throw new RuntimeException("Email delivery failed", e);
        }
    }

    private String buildHtml(String userName, String resetLink) {
        return """
            <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d1610;border-radius:14px;color:#e8f5ec">
              <div style="text-align:center;margin-bottom:24px">
                <div style="font-size:32px">🌾</div>
                <div style="font-size:18px;font-weight:800;color:#2ecc71;margin-top:6px">Paddy AI</div>
              </div>
              <h2 style="color:#fff;font-size:18px;margin-bottom:8px">Hi %s,</h2>
              <p style="color:rgba(232,245,236,0.75);font-size:14px;line-height:1.6">
                We received a request to reset your Paddy AI password. Click the button below to choose a new one.
                This link is valid for <strong>30 minutes</strong>.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="%s" style="background:#2ecc71;color:#06120a;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;display:inline-block;font-size:14px">
                  Reset Password
                </a>
              </div>
              <p style="color:rgba(232,245,236,0.45);font-size:12px;line-height:1.6">
                If you didn't request this, you can safely ignore this email — your password will remain unchanged.
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <span style="color:#2ecc71;word-break:break-all">%s</span>
              </p>
            </div>
            """.formatted(userName, resetLink, resetLink);
    }
}
