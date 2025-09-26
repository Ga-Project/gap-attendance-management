import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Slide,
  SlideProps,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import notificationService, { Notification, NotificationType } from '../services/notificationService';

// Slide transition component
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to notification service
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);

      // Auto-remove non-persistent notifications
      if (!notification.persistent && notification.duration) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id: string): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClose = (id: string) => (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    removeNotification(id);
  };

  const getSeverity = (type: NotificationType): 'success' | 'error' | 'warning' | 'info' => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'success';
      case NotificationType.ERROR:
        return 'error';
      case NotificationType.WARNING:
        return 'warning';
      case NotificationType.INFO:
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          onClose={handleClose(notification.id)}
          TransitionComponent={SlideTransition as React.ComponentType<TransitionProps & { children: React.ReactElement<any, any> }>}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            '& .MuiSnackbar-root': {
              position: 'relative',
            },
          }}
        >
          <Alert
            onClose={handleClose(notification.id)}
            severity={getSeverity(notification.type)}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: 300,
              maxWidth: 500,
            }}
            action={
              notification.actions && notification.actions.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      color="inherit"
                      size="small"
                      variant={action.variant || 'text'}
                      onClick={() => {
                        action.action();
                        removeNotification(notification.id);
                      }}
                      sx={{
                        color: 'inherit',
                        borderColor: 'currentColor',
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              ) : undefined
            }
          >
            <AlertTitle>{notification.title}</AlertTitle>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationProvider;