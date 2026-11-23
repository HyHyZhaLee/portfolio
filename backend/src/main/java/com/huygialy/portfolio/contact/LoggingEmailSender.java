package com.huygialy.portfolio.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** The local profile's sender: nothing leaves a developer machine, and only the message ID is logged (PF-006 FR-10). */
@Component
@Profile("local")
class LoggingEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailSender.class);

    @Override
    public String send(Email email) {
        log.info("Contact message {} not emailed: the local profile logs instead of sending", email.messageId());
        return "local-" + email.messageId();
    }
}
