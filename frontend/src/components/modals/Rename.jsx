import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import { Modal, Form, Button } from 'react-bootstrap';
import { actions as modalActions } from '../../slices/modalSlices';
import { useSocket } from '../../hooks';
import { channelNameValidation } from './Add';

const Rename = () => {
  const socketApi = useSocket();
  const dispatch = useDispatch();

  const { channels } = useSelector((state) => state.channels);
  const { channelId } = useSelector((state) => state.modals);

  const channelsNames = channels.map(({ name }) => name);
  const renamingChannel = channels.find((channel) => channel.id === channelId);

  const { hideModal } = modalActions;

  const formik = useFormik({
    initialValues: { name: renamingChannel.name },
    validationSchema: channelNameValidation(channelsNames),
    onSubmit: async (values) => {
      try {
        await socketApi.renameChan({ id: channelId, name: values.name });
        dispatch(hideModal());
        formik.resetForm();
      } catch (error) {
        console.error(error);
      }
    },
  });

  // ? не срабатывает селект на содержимом внутри инпута
  // при открытии модального окна переименовать
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.select();
  }, []);

  return (
    <Modal show centered onHide={() => dispatch(hideModal())}>
      <Modal.Header closeButton onHide={() => dispatch(hideModal())}>
        <Modal.Title>Переименовать канал</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={formik.handleSubmit}>
          <Form.Group>
            <Form.Control
              required
              ref={inputRef}
              onChange={formik.handleChange}
              value={formik.values.name}
              name="name"
              id="name"
              className="mb-2"
              isInvalid={(formik.errors.name && formik.touched.name)}
            />
            <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
            <Form.Label htmlFor="name" hidden>Имя канала</Form.Label>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button onClick={() => dispatch(hideModal())} type="button" className="me-2" variant="secondary">Отменить</Button>
            <Button type="submit" variant="primary">Отправить</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default Rename;
