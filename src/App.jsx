import { BrowserRouter, Route, Routes } from "react-router-dom";
import SuperAdminLayout from "./Layout/SuperAdmin";
import NotFound from "./pages/404Page";
import ScrollToTop from "./services/scrollToTop";
import ProtectedRoute from "./services/protectRoutes";
import ProtectedAccess from "./services/protectAccess";

import Login from "./pages/auth/login";
import Footer from "./pages/footer";

import ForgetPassword from "./pages/auth/forgetPassword";
import ResetPassword from "./pages/auth/resetPassword";
import { FaAngleUp } from "react-icons/fa";
import SettingsPage from "./pages/settings/informations";
import Profile from "./pages/auth/profile";
import ManageAdmins from "./pages/admins/Adminsmanagment";
import AddAdmin from "./pages/admins/addAdmin"
import ManageItems from "./pages/delivery/items";
import DeliveryForm from "./pages/delivery/createDelivery";
import { useEffect } from "react";
import api from "./services/api";
import { useSystemSettings } from "./context/shareInfo";
import CustomerForm from "./pages/customer/createCustomer";
import EditDeliveryForm from "./pages/delivery/editDelivery";
import DeliveriesList from "./pages/delivery/allDeliveries";
import PrintDeliveryPage from "./pages/delivery/deliveryPrint";
import PrintItemPage from "./pages/delivery/itemsPrint";
import CustomerList from "./pages/customer/customerList";
import EditCustomer from "./pages/customer/editCustomer";
import CustomerBalanceAutocomplete from "./pages/customer/customerBalance";
import PrintStatement from "./pages/customer/printStatement";
import Expenses from "./pages/expenses/expenses";

import MoneyBoxPage from "./pages/moneyBox/moneyBox"
import CashBoxAuditPrint from "./pages/moneyBox/invertoryPrint"
import ActivityLogs from "./pages/activationLog/activationlog";
import CustomerPaymentsPrintPage from "./pages/customer/CustomerPaymentsPrintPage";
import ChequeManagement from "./pages/moneyBox/ChequeManagement";
import LogsCleanupModal from "./pages/activationLog/LogsCleanupModal";
import AddSupplierFormSUP from "./pages/supplier/createSupplier";
import SupplierList from "./pages/supplier/supplierList";
import EditSupplier from "./pages/supplier/editSupplier";
import SupplierBalanceAutocomplete from "./pages/supplier/supplierBalance";
import SupplierPaymentsPrintPage from "./pages/supplier/supplierPaymentsPrintPage";
import EquipmentForm from "./pages/purchase/equipment/equipmentForm";
import EquipmentManager from "./pages/purchase/equipment/EquipmentManager";
import EquipmentList from "./pages/purchase/equipment/EquipmentList";
import PrintEquipmentPage from "./pages/purchase/equipment/printPurchase";
import PrintEquipmentPage2 from "./pages/purchase/equipment/printEquipment";
import EquipmentEditForm from "./pages/purchase/equipment/edit";
import EquipmentSupply from "./pages/purchase/equipmentSupply/equipmentSupplyForm";
import EquipmentSupplyEdit from "./pages/purchase/equipmentSupply/EquipmentSupplyEdit";
import EquipmentSupplyList from "./pages/purchase/equipmentSupply/EquipmentSupplyList";
import PrintEquipmentSupplyPage from "./pages/purchase/equipmentSupply/printSupplyPurchase";
import PrintSupplyPage from "./pages/purchase/equipmentSupply/printSupply";
import Maintenance from "./pages/purchase/maintenance/maintenanceform";
import MaintenanceEdit from "./pages/purchase/maintenance/maintenanceEdit";
import MaintenanceList from "./pages/purchase/maintenance/maintenanceList";
import PrintMaintenancePage from "./pages/purchase/maintenance/maintenancePrint";
import PrintMaintenancePartPage from "./pages/purchase/maintenance/maintenancePartPrint";
import CreateWireForm from "./pages/purchase/wire/wireCreate";
import WireTypeManager from "./pages/purchase/wire/WireManager";
import EditWireForm from "./pages/purchase/wire/wireEdit";
import WireList from "./pages/purchase/wire/wireList";
import PrintWirePartPage from "./pages/purchase/wire/printPartWire";
import PrintWirePage from "./pages/purchase/wire/printPurchaseWire";
import BagTypeManager from "./pages/purchase/bag/BagManager";
import CreateBagForm from "./pages/purchase/bag/bagCreate";
import EditBagForm from "./pages/purchase/bag/bagEdit";
import BagList from "./pages/purchase/bag/bagList";
import PrintBagPage from "./pages/purchase/bag/printPurchaseBag";
import PrintBagPartPage from "./pages/purchase/bag/printPartBag";
import MoneyDashboard from "./pages/moneyBox/MoneyDashboard";
import SupplierStatement from "./pages/supplier/printStatementSupplier";
import PurchasesHub from "./pages/purchase/PurchasesHub";

import ReportsApp from "./pages/reports/ReportsApp";
import Dashboard from "./pages/dashboard/Dashboard";
import Cheque from "./pages/moneyBox/cheque";
import ChequesReport from "./pages/advancedReports/chequeReports";
import CustomersReport from "./pages/advancedReports/customerReports";
import EquipmentReport from "./pages/advancedReports/EquipmentReport";
import SuppliersReport from "./pages/advancedReports/SuppliersReport";
import UserActivityReport from "./pages/advancedReports/UserActivityReport";
import BackupSettings from "./pages/settings/backupSystem";
import CustomerAccountSummary from "./pages/customer/summaryStatement";
import SupplierAccountSummary from "./pages/supplier/SupplierAccountSummary";
import SupplierPrintManager from "./pages/customer/customerPrintMangement";
import CustomerChequeAutocomplete from "./pages/moneyBox/addCheque";
import DeliveriesReport from "./pages/advancedReports/DeliveriesReport";
import ItemsReport from "./pages/advancedReports/ItemsReport";
import InstallApp from "./services/install";
import ChequeBoxAuditPrint from "./pages/moneyBox/chequeFilter";
import ComprehensiveReport from "./pages/normalReport/ComprehensiveReport";
import BackButton from "./services/backButton";

function App() {
   const upToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const savedSettings = JSON.parse(localStorage.getItem("settings"));

if (savedSettings?.theme) {
  const root = document.documentElement;

  root.style.setProperty("--primary", savedSettings.theme.primary);
  root.style.setProperty("--secondary", savedSettings.theme.secondary);
  root.style.setProperty("--accent", savedSettings.theme.accent);
  root.style.setProperty("--background", savedSettings.theme.background);

  root.style.setProperty("--system-font", savedSettings.systemFont);
  root.style.setProperty("--invoice-font", savedSettings.invoiceFont);

}

return (
  <div className="">


    <BrowserRouter>
     <BackButton />
      <ScrollToTop />
      <InstallApp />

      

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forget-Password" element={<ForgetPassword />} />
        <Route path="/reset-Password" element={<ResetPassword />} />

        {/* Super Admin */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedAccess role="superadmin">
                <SuperAdminLayout />
              </ProtectedAccess>
            </ProtectedRoute>
          }
        >


          
          <Route path="/" element={<Dashboard />} />


          {/* customer */}
          <Route path="/customer/add" element={<CustomerForm />} />
          <Route path="/customer" element={<CustomerList />} />
          <Route path="/customer/edit/:id" element={<EditCustomer />} />
          <Route path="/customer/payments" element={<CustomerBalanceAutocomplete />} />
          <Route path="/customer/printSupplierDetails/:customerId" element={<PrintStatement />} />
          <Route path="/customer/CustomerPaymentsPrintPage/:id" element={<CustomerPaymentsPrintPage />} />
          <Route path="/customer/CustomerAccountSummary/:customerId" element={<CustomerAccountSummary />} />
          <Route path="/customer/SupplierPrintManager/:customerId" element={<SupplierPrintManager />} />



          {/* supplier */}
          <Route path="/supplier/add" element={<AddSupplierFormSUP />} />
          <Route path="/supplier" element={<SupplierList />} />
          <Route path="/supplier/edit/:id" element={<EditSupplier />} />
          <Route path="/supplier/payments" element={<SupplierBalanceAutocomplete />} />
          <Route path="/supplier/printSupplierDetails/:supplierId" element={<SupplierStatement />} />
          <Route path="/supplier/CustomerPaymentsPrintPage/:id" element={<SupplierPaymentsPrintPage />} />
          <Route path="/supplier/SupplierAccountSummary/:id" element={<SupplierAccountSummary />} />






          
          {/* delivery (OUT) */}
        <Route path="/deliveries/ManageItems" element={<ManageItems />} />
        <Route path="/deliveries/add" element={<DeliveryForm />} />
        <Route path="/deliveries/edit/:id" element={<EditDeliveryForm />} />
        <Route path="/deliveries" element={<DeliveriesList />} />
        <Route path="/deliveries/print/:id" element={<PrintDeliveryPage />} />
        <Route path="/deliveries/item/print/:id" element={<PrintItemPage />} />



         {/* PurchasesHub */}
        <Route path="/PurchasesHub" element={<PurchasesHub />} />


         
        {/*  Equipment in */}
        <Route path="/equipment/EquipmentManager" element={<EquipmentManager />} />
        <Route path="/equipment/add" element={<EquipmentForm />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/equipment/print/:id" element={<PrintEquipmentPage />} />
        <Route path="/equipment/part/print/:id" element={<PrintEquipmentPage2 />} />
        <Route path="/equipment/edit/:id" element={<EquipmentEditForm />} />

        {/*  Equipment Supply in */}
        <Route path="/equipmentSupply/add" element={<EquipmentSupply />} />
        <Route path="/equipmentSupply" element={<EquipmentSupplyList />} />
        <Route path="/equipmentSupply/print/:id" element={<PrintEquipmentSupplyPage />} />
        <Route path="/equipmentSupply/part/print/:id" element={<PrintSupplyPage />} />
        <Route path="/equipmentSupply/edit/:id" element={<EquipmentSupplyEdit />} />



        {/*  Equipment Maintenance  in */}
        <Route path="/Maintenance/add" element={<Maintenance />} />
        <Route path="/Maintenance" element={<MaintenanceList />} />
        <Route path="/Maintenance/print/:id" element={<PrintMaintenancePage />} />
        <Route path="/Maintenance/part/print/:id" element={<PrintMaintenancePartPage />} />
        <Route path="/Maintenance/edit/:id" element={<MaintenanceEdit />} />


        {/*  wire   in */}
        <Route path="/wire/EquipmentManager" element={<WireTypeManager />} />
        <Route path="/wire/add" element={<CreateWireForm />} />
        <Route path="/wire" element={<WireList />} />
        <Route path="/wire/print/:id" element={<PrintWirePage />} />
        <Route path="/wire/part/print/:id" element={<PrintWirePartPage />} />
        <Route path="/wire/edit/:id" element={<EditWireForm />} />


        {/*  bag   in */}
        <Route path="/bag/EquipmentManager" element={<BagTypeManager />} />
        <Route path="/bag/add" element={<CreateBagForm />} />
        <Route path="/bag" element={<BagList />} />
        <Route path="/bag/print/:id" element={<PrintBagPage />} />
        <Route path="/bag/part/print/:id" element={<PrintBagPartPage />} />
        <Route path="/bag/edit/:id" element={<EditBagForm />} />




         {/*report  */}

         
        <Route path="/report" element={<ComprehensiveReport />} />

        <Route path="/advancedReport/cheque" element={<ChequesReport />} />
        <Route path="/advancedReport/customer" element={<CustomersReport />} />
        <Route path="/advancedReport/equipment" element={<EquipmentReport />} />
        <Route path="/advancedReport/supplier" element={<SuppliersReport />} />
        <Route path="/advancedReport/user" element={<UserActivityReport />} />
        <Route path="/advancedReport/delivery" element={<DeliveriesReport />} />
        <Route path="/advancedReport/items" element={<ItemsReport />} />




        

        {/* Expenses */}
         <Route path="/expenses" element={<Expenses />} />




          {/* money box */}
           <Route path="treasury" element={<MoneyBoxPage/>} ></Route>
           <Route path="treasury/inventory" element={<CashBoxAuditPrint/>} ></Route>
           <Route path="ChequeManagement" element={<ChequeManagement/>} ></Route>
           <Route path="MoneyDashboard" element={<MoneyDashboard/>} ></Route>
           <Route path="cheque/:chequeId" element={<Cheque/>} ></Route>
           <Route path="addCheque" element={<CustomerChequeAutocomplete/>} ></Route>

           <Route path="chequeFilter" element={<ChequeBoxAuditPrint/>} ></Route>


          {/* admin */}
        <Route path="/admin/add" element={<AddAdmin />} />
        <Route path="/admin/users" element={<ManageAdmins />} />

          
          


        {/* profile */}
        <Route path="/profile" element={<Profile />} />

        

        {/* settings */}
        <Route path="/settings/info" element={<SettingsPage />} />
        <Route path="/settings/ActivityLogs" element={<ActivityLogs />} />
        <Route path="/BackupSettings" element={<BackupSettings />} />

        

        </Route>



        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* UI Elements - Scroll To Top */}
      <div
        onClick={upToTop}
        className="no-print fixed bottom-8 left-8 z-50 
                  bg-accent text-ligth 
                  p-4 rounded-[20px] 
                  shadow-2xl
                  hover:bg-brown hover:-translate-y-2 
                  active:scale-90 
                  transition-all duration-300 cursor-pointer 
                   flex items-center justify-center"
        title="العودة للأعلى"
      >

        <FaAngleUp className="text-2xl text-light font-black relative z-10" />
       
      </div>

      <Footer />
    </BrowserRouter>
   
  </div>
);
}

export default App
