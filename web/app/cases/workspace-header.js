import Link from "next/link";

import { signOut } from "../login/actions";

export default function WorkspaceHeader({ email }) {
  return (
    <header className="workspace-nav">
      <Link className="brand" href="/cases">
        <span className="brand-mark" aria-hidden="true">TA</span>
        <span>Tax Audit PH</span>
      </Link>
      <div className="workspace-user">
        <span>{email}</span>
        <form action={signOut}><button className="text-button">Sign out</button></form>
      </div>
    </header>
  );
}
