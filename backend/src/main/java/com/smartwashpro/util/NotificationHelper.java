package com.smartwashpro.util;

import com.smartwashpro.model.Notification;
import com.smartwashpro.model.User;
import com.smartwashpro.model.enums.NotificationType;
import com.smartwashpro.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class NotificationHelper {
    private final NotificationRepository notificationRepository;

    public NotificationHelper(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }


    public void send(User user, String title, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }
}
