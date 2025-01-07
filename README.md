This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Prompts:

Build fullstack dashboard for hotel management system with tech stack:

- next js 15
- supabase
- prisma
- ant design
- typescript

Requirements:

- A guest can make a booking for a hotel room. When they book a room, they specify the date they are checking in and the date they are checking out, the number of adults and children.
- A guest can book multiple rooms as part of their booking.
- A hotel has many rooms that it can sell to guests. Each room has a unique room number for the hotel, and is on a specific floor.
- Each room is a specific type or class, such as Deluxe or Standard. The room type defines the quality of the room as well as the features.
- A room has a range of features, such as air conditioning, TV, or a coffee machine. There's defined list of features and each room of the same class has the same set of features (for example, all Standard rooms may have a kettle, and all Deluxe rooms may have a kettle and a coffee machine).
- Each room type has a specific number of beds and type of beds, such as "two single beds" or "one king bed".
- Each room type has a base price for booking a room for a night.
- A guest can pay for extra features or previleges for their booking. Examples are breakfast in the morning, a small extra fee for the ability to get a full refund, or valet parking. These extras may be paid at the time of booking, or during their stay (such as minibar usage).
- The total price for a booking is calculated based on the number of rooms, the number of days, the base price for the selected room type, and any extras.
- The system can indicate whether a guest has paid for their booking, or not.
- The system can tell which rooms are available for booking, which ones are empty and yet to be cleaned, and which ones are cleaned and ready for guests.
- A guest will need to provide their name and email address, and phone number when making a booking.
