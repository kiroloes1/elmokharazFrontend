import { Outlet } from "react-router-dom"
import Sidebar from "../pages/sideBar"
import BackupButton from "../pages/backup/backup"
import DevSphereChatBot from "../services/chatbot"
import ReportsChatbot from "../services/chatbot"
import ReportsAiChatbot from "../services/chatbot"
import LogsCleanupModal from "../pages/activationLog/LogsCleanupModal"

export default function SuperAdminLayout() {
  return (
<>
    <div dir="rtl"  className="dashboard flex min-h-screen w-full min-w-0 overflow-x-hidden">

      <div className="shrink-0 min-h-screen bg-dark"><Sidebar role={"superadmin"}/></div>

          <div className="content flex-1 min-w-0 w-0 overflow-x-hidden">
        <Outlet />
      </div>

             


  
    </div>
    <BackupButton/>
           <LogsCleanupModal />
{/* 
    <ReportsAiChatbot/> */}


    

</>


  )
}
