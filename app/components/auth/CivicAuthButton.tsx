'use client';

import { UserButton, useUser } from "@civic/auth-web3/react";

export function CivicAuthButton() {
  const { user } = useUser();

  return (
    <UserButton />
  );
} 