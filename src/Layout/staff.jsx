import { Outlet } from "react-router-dom"

export default function staddLayout() {
  return (
    <div dir="rtl" className="dashboard">
      <aside>staff</aside>

      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}
