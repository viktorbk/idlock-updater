import React from 'react';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { modalErrorStyles } from '../css/ModalError.styles';

type ModalErrorProps = {
  visible: boolean;
  errorMessage: string;
  onDismiss: () => void;
  title?: string;
};

export default function ModalError({
  visible,
  errorMessage,
  onDismiss,
  title = 'Connection Error',
}: ModalErrorProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={modalErrorStyles.container}
        dismissable
        dismissableBackButton
      >
        <Text variant="titleLarge" style={modalErrorStyles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={modalErrorStyles.message}>
          {errorMessage}
        </Text>
        <Button mode="contained" onPress={onDismiss}>
          OK
        </Button>
      </Modal>
    </Portal>
  );
}

