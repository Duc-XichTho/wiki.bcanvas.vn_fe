import React, { useContext, useEffect, useState } from "react";
import styles from "./gateway.module.css";
import { MyContext } from "../../MyContext";
// API
import { getAllTicketByCompany } from "../../apis/gateway/ticketService";
import { getPermissionByUserAndCompany } from "../../apis/gateway/permissonService";
import { getAllTag } from "../../apis/gateway/tagService";
// COMPONENT
import Header from "./Header/header";
import LeftPanel from "./LeftPanel/leftPanel";
import RightPanel from "./RightPanel/rightPanel";
import Footer from "./Footer/Footer";

function Gateway() {
  const { listCompany, userList, currentUser, fetchCurrentUser } =
    useContext(MyContext);
  const [selectedCompany, setSelectedCompany] = useState(
    listCompany?.[0]?.id || ""
  );
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState([]);

  useEffect(() => {
    if (selectedCompany) {
      loadData();
    } else {
      setTickets([]);
      setSelectedTicket(null);
    }
  }, [selectedCompany]);

  useEffect(() => {
    // If tickets change and we have tickets, select the first one if none is selected
    if (tickets.length > 0 && !selectedTicket) {
      setSelectedTicket(tickets[0]);
    } else if (tickets.length === 0) {
      // If no tickets, ensure no ticket is selected
      setSelectedTicket(null);
    }
  }, [tickets]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket');

    if (ticketId && tickets.length > 0) {
      // Find the ticket with matching ID
      const ticketToSelect = tickets.find(ticket => ticket.id === parseInt(ticketId, 10));
      if (ticketToSelect) {
        setSelectedTicket(ticketToSelect);
      }
    }
  }, [tickets]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (selectedCompany) {
        const tickets = await getAllTicketByCompany(selectedCompany);
        setTickets(tickets);
        if (tickets.length > 0) {
          setSelectedTicket(tickets[0]);
        } else {
          setSelectedTicket(null);
        }
        const permissions = await getPermissionByUserAndCompany(currentUser.email.split("@")[0], selectedCompany);
        setPermission(permissions);
      }

      const tags = await getAllTag();
      setTags(tags);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header
        companyList={listCompany}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        currentUser={currentUser}
        fetchCurrentUserLogin={fetchCurrentUser}
        tickets={tickets}
        setSelectedTicket={setSelectedTicket}
        userList={userList}
      />
      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <LeftPanel
            tickets={tickets}
            setTickets={setTickets}
            tags={tags}
            setTags={setTags}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            isLoading={isLoading}
            selectedCompany={selectedCompany}
            userList={userList}
            currentUser={currentUser}
            permission={permission}
          />
        </div>
        <div className={styles.rightPanel}>
          <RightPanel
            setSelectedTicket={setSelectedTicket}
            selectedTicket={selectedTicket}
            tags={tags}
            setTickets={setTickets}
            currentUser={currentUser}
            userList={userList}
            permission={permission}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Gateway;
