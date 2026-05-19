import {
  RULE_NAME,
  noParsedBodyBeforeVerificationRule
} from "../../src/rules/noParsedBodyBeforeVerification";
import { ruleTester } from "../test-utils/ruleTester";

ruleTester.run(RULE_NAME, noParsedBodyBeforeVerificationRule, {
  valid: [
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const body = await request.text();
          const event = stripe.webhooks.constructEvent(body, "sig", "s");
          return event;
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const event = stripe.webhooks.constructEvent(await request.text(), "sig", "s");
          const data = await request.json();
          return data;
        }
      `
    },
    {
      code: `
        export async function unrelated(request: Request) {
          const data = await request.json();
          return data;
        }
      `
    },
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const buf = Buffer.from(await request.arrayBuffer());
          const event = stripe.webhooks.constructEvent(buf, "sig", "s");
        }
      `
    }
  ],
  invalid: [
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(request: Request) {
          const body = await request.json();
          const event = stripe.webhooks.constructEvent(body, "sig", "s");
        }
      `,
      errors: [{ messageId: "parsedBeforeVerification", data: { kind: "request.json" } }]
    },
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(req: any) {
          const data = JSON.parse(req.rawBody);
          const event = stripe.webhooks.constructEvent(req.rawBody, "sig", "s");
        }
      `,
      errors: [{ messageId: "parsedBeforeVerification", data: { kind: "JSON.parse" } }]
    },
    {
      code: `
        import Stripe from "stripe";
        import express from "express";
        const stripe = new Stripe("");
        const app = express();
        app.use(express.json());
        app.post("/webhook", (req: any, res: any) => {
          const event = stripe.webhooks.constructEvent(req.body, "sig", "s");
        });
      `,
      errors: [
        { messageId: "parsedBeforeVerification", data: { kind: "express.json" } },
        { messageId: "parsedBeforeVerification", data: { kind: "request.body-access" } }
      ]
    },
    {
      code: `
        import Stripe from "stripe";
        const stripe = new Stripe("");
        export async function POST(req: any) {
          const userId = req.body.userId;
          const event = stripe.webhooks.constructEvent(req.body, "sig", "s");
        }
      `,
      errors: [
        { messageId: "parsedBeforeVerification", data: { kind: "request.body-access" } },
        { messageId: "parsedBeforeVerification", data: { kind: "request.body-access" } }
      ]
    }
  ]
});
