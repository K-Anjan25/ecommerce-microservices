package com.ecommerce.user_service.service;

import com.ecommerce.event_bus.dto.EmailRequest;
import com.ecommerce.user_service.config.EmailConfig;
import com.ecommerce.user_service.constant.EmailConstant;
import com.ecommerce.user_service.exception.EmailSendingException;
import com.sun.mail.smtp.SMTPTransport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.activation.DataHandler;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;
import java.util.Base64;
import java.util.Date;
import java.util.Properties;

import static com.ecommerce.user_service.constant.EmailConstant.*;
import static javax.mail.Message.RecipientType.TO;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailConfig emailConfig;

    public void sendEmail(EmailRequest emailRequest) {
        try {
            Message message = createEmail(emailRequest);
            SMTPTransport smtpTransport = (SMTPTransport) getEmailSession().getTransport(SIMPLE_MAIL_TRANSFER_PROTOCOL);
            smtpTransport.connect(GMAIL_SMTP_SERVER, emailConfig.getUsername(), emailConfig.getPassword());
            smtpTransport.sendMessage(message, message.getAllRecipients());
            smtpTransport.close();
        }catch (MessagingException e){
            throw new EmailSendingException(EMAIL_SENDING_ERROR);
        }
    }

    private Message createEmail(EmailRequest emailRequest) throws MessagingException {
        Message message = new MimeMessage(getEmailSession());
        message.setFrom(new InternetAddress(emailConfig.getFromEmail()));
        message.setRecipients(TO, InternetAddress.parse(emailRequest.getEmail(), false));
        message.setSubject(emailRequest.getSubject());
        message.setSentDate(new Date());
        if (emailRequest.hasAttachment()) {
            // Multipart mail: text body + attachment (e.g. PDF invoice).
            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText(emailRequest.getText(), "utf-8");

            MimeBodyPart attachmentPart = new MimeBodyPart();
            attachmentPart.setDataHandler(new DataHandler(new ByteArrayDataSource(
                    Base64.getDecoder().decode(emailRequest.getAttachmentBase64()), "application/pdf")));
            attachmentPart.setFileName(emailRequest.getAttachmentName());

            MimeMultipart multipart = new MimeMultipart();
            multipart.addBodyPart(textPart);
            multipart.addBodyPart(attachmentPart);
            message.setContent(multipart);
        } else {
            message.setText(emailRequest.getText());
        }
        message.saveChanges();
        return message;
    }

    private Session getEmailSession() {
        Properties properties = System.getProperties();
        properties.put(SMTP_HOST, GMAIL_SMTP_SERVER);
        properties.put(SMTP_AUTH, true);
        properties.put(SMTP_PORT, DEFAULT_PORT);
        properties.put(SMTP_STARTTLS_ENABLE, true);
        properties.put(SMTP_STARTTLS_REQUIRED, true);
        properties.put(SMTP_SSL_ENABLE, true);
        return Session.getInstance(properties, null);
    }
}
