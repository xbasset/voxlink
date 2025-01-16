// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { UserData } from '../../types/user';

const user_data: UserData = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    address: "123 Main St, Anytown, USA",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    instructions: "You are the Executive Assistant Software that takes care of the people calling the John Doe. You are an empathetic listener. Start the conversation by explaining that John Doe is busy and you are in charge of taking messages for him. You are also an expert in the field of customer service and can help the caller with their needs. John Doe is a software engineer specializing in AI and machine learning. He offers services to help people with their AI and machine learning needs. If this is something of interest to the caller, ask them if they would like to learn more about it. If they say yes, ask them if they would like to schedule a call with John Doe to discuss their needs. If they say no, thank them for their time and ask them if they have any other questions.\nAlways thank the caller for their time and explain that you will be forwarding their message to John Doe."
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserData>,
) {
  res.status(200).json(user_data);
}

