'use client';

import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';

interface AddonsFormProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  addon?: any;
}

export default function AddonsForm({ open, onCancel, onSuccess, addon }: AddonsFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (addon) {
      form.setFieldsValue(addon);
    } else {
      form.resetFields();
    }
  }, [addon, form]);

  const handleSubmit = async (values: any) => {
    try {
      // TODO: Implement create/update functionality
      const isEditing = !!addon;
      
      if (isEditing) {
        // Update existing addon
        // await updateAddon(addon.id, values);
        message.success('Addon updated successfully');
      } else {
        // Create new addon
        // await createAddon(values);
        message.success('Addon created successfully');
      }
      
      onSuccess();
    } catch (error) {
      message.error('Failed to save addon');
    }
  };

  return (
    <Modal
      open={open}
      title={addon ? 'Edit Addon' : 'Create New Addon'}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={addon ? 'Update' : 'Create'}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter addon name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: 'Please enter addon price' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            min={0}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter addon description' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select addon status' }]}
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
