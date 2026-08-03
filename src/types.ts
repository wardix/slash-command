export interface SlashCommandData {
  command: string;
  inbox_id: number;
  agent_email: string;
  channel_id: string;
  customer_phone_number: string;
}

export interface ParameterOption {
  label: string;
  value: string;
}

export interface Parameter {
  tag: 'select' | 'input' | 'textarea';
  name: string;
  required?: boolean | string;
  options?: ParameterOption[];
  type?: string;
  value?: string;
  placeholder?: string;
}

export interface Action {
  parameters: Parameter[];
}

export interface SubmitDialogResponseData extends SlashCommandData {
  action: Action;
}

export interface SubmitDialogResponse {
  type: string;
  data: SubmitDialogResponseData;
}

export interface MessageResponse {
  type: string;
  data: SlashCommandData;
  text: string;
}

export interface SubmitDialogValueParameter {
  name: string;
  value: string;
}

export interface NisCreateTicketPayload {
  subscriber_id: string | number;
  type_id: string | number;
  status: string;
  subject: string;
  comment: string;
  inbox_id: number;
  agent_email: string;
  channel_id: string;
  customer_phone_number: string;
}

export interface NisCreateTicketResponse {
  success?: boolean;
  ticket_id?: string | number;
  message?: string;
}

export interface NisSubscriber {
  subscriber_id: number;
  subscriber_name: string;
  domain: string;
  service: string;
  installation_address: string;
}

export interface NisApiResponse {
  results: NisSubscriber[];
}

export interface NisEmployee {
  employee_id: string;
  name: string;
  email: string;
}
