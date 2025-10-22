import React, { useEffect, useState } from "react";
import styles from "./mainContent.module.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md"; // Import icon Copy
import { CheckCheck }from "lucide-react";


// ICON
import {
  Paperclip,
  Edit2,
  Check,
  X,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
  Highlighter,
  Save,
  Upload,
} from "lucide-react";
// API
import { updateTicket } from "../../../../apis/gateway/ticketService";
import { uploadFileService } from "../../../../apisKTQT/uploadFileService";
import { createNotification } from "../../../../apis/gateway/notificationService";
import { sendChangeStatusTicket } from "../../../../apis/gateway/emailService";
// CONSTANT
import { STATUS_PENDING, STATUS_COMPLETED, STATUS_REVIEW, TYPE_CUSTOMER } from "../../../../GATEWAY_CONST";
// TipTap Editor
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TableExtension from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlock from "@tiptap/extension-code-block";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

function MainContent({ setSelectedTicket, selectedTicket, tags, setTickets, currentUser, userList, permission }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [completionStatus, setCompletionStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Local state for editing
  const [editedTicket, setEditedTicket] = useState({
    title: "",
    deadline: "",
    tag: "",
    noteContent: "",
  });

  // Check if current user is the PIC
  const isPIC =
    currentUser &&
    selectedTicket?.pic &&
    (currentUser.email.toLowerCase() === selectedTicket.pic.toLowerCase() ||
      currentUser.email.split("@")[0].toLowerCase() === selectedTicket.pic.toLowerCase() ||
      (selectedTicket.pic.includes('@') &&
        currentUser.email.split("@")[0].toLowerCase() === selectedTicket.pic.split('@')[0].toLowerCase()));

  // Move canEditTicket function before editor initialization
  const canEditTicket = () => {
    if (!permission?.isEditor) return false;
    if (permission?.isGuest) {
      return selectedTicket?.type === TYPE_CUSTOMER;
    }
    return true;
  };

  // Initialize editor first
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Nhập nội dung ghi chú...",
      }),
      LinkExtension.configure({
        openOnClick: true,
        autolink: true,
      }),
      ImageExtension.configure({
        allowBase64: true,
        inline: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      TableExtension.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlock,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      UnderlineExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "",
    editable: canEditTicket(),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleNoteContentChange(html);
    },
    // Add paste handler for images
    editorProps: {
      handlePaste: (view, event) => {
        // Check if the clipboard has files (images)
        const items = Array.from(event.clipboardData?.items || []);
        const imageItems = items.filter(
          (item) => item.type.indexOf("image") === 0
        );

        if (imageItems.length > 0) {
          event.preventDefault();

          // Process each image
          imageItems.forEach((item) => {
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file);
            }
          });

          return true; // Indicate we've handled the paste
        }

        // For other content, let TipTap handle it
        return false;
      },
      // Add drop handler for drag and drop
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter(
            (file) => file.type.indexOf("image") === 0
          );

          if (imageFiles.length > 0) {
            event.preventDefault();

            // Process each image
            imageFiles.forEach((file) => {
              handleImageUpload(file);
            });

            return true; // Indicate we've handled the drop
          }
        }

        // For other content, let TipTap handle it
        return false;
      },
    },
  });

  // Then add the useEffect for editor updates
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEditTicket());
    }
  }, [editor, permission, selectedTicket]);

  // When selected ticket changes, update editor content and local status
  useEffect(() => {
    if (selectedTicket) {
      // Update local state
      setEditedTicket({
        title: selectedTicket.title || "",
        deadline: selectedTicket.deadline || "",
        tag: selectedTicket.tag || "",
        noteContent: selectedTicket.noteContent || "",
      });

      setIsEditingTitle(false);

      // Update editor content safely
      if (editor) {
        // Use setTimeout to ensure this runs after the editor is fully initialized
        setTimeout(() => {
          editor.commands.setContent(selectedTicket.noteContent || "");
        }, 0);
      }

      // Update local status from the selected ticket
      setLocalStatus(selectedTicket.status || "");
      setCompletionStatus(selectedTicket.review || false);
    }
  }, [selectedTicket, editor]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);


  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev); // Đảo ngược trạng thái khi bấm nút
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTicket((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle content change with debounce
  const handleNoteContentChange = (noteContent) => {
    // Update local state
    setEditedTicket((prev) => ({
      ...prev,
      noteContent,
    }));

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
      saveNoteContent(noteContent);
    }, 1000); // 1 second debounce

    setSaveTimeout(timeoutId);
  };

  // Save content to backend
  const saveNoteContent = async (noteContent) => {
    if (!selectedTicket?.id) return;

    try {
      setIsSavingContent(true);

      const updatedData = {
        id: selectedTicket.id,
        noteContent,
      };

      const response = await updateTicket(updatedData);

      // Update the tickets state with the response from server
      if (response) {
        // Make sure we update the tickets state with all the updated data
        updateTicketsState(updatedData);
      }
    } catch (error) {
      console.error("Error saving note content:", error);
      // If there's an error, maybe reset content to last known good state
    } finally {
      setIsSavingContent(false);
    }
  };

  // Helper function to update tickets state
  const updateTicketsState = (updatedData) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.id === updatedData.id
          ? {
            ...ticket,
            ...updatedData,
            // Ensure these specific fields are updated for the left panel
            status: updatedData.status || ticket.status,
            completed: updatedData.completed ?? ticket.completed,
            review: updatedData.review ?? ticket.review,
            pic: updatedData.pic || ticket.pic, // Make sure PIC is updated
          }
          : ticket
      )
    );
  };

  // Link handling
  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setShowLinkModal(true);
  };

  const confirmLink = () => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl("");
  };

  const cancelLink = () => {
    setShowLinkModal(false);
    setLinkUrl("");
  };

  // Add table functionality
  const addTable = () => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  // Add these functions after the addTable function:
  const addTableRow = () => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  };

  const deleteTableRow = () => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  };

  const addTableColumn = () => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteTableColumn = () => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  };

  // Other handlers remain the same as before...
  const handleDeadlineChange = async (e) => {
    if (!canEditTicket()) return;
    const newDeadline = e.target.value;
    setEditedTicket((prev) => ({ ...prev, deadline: newDeadline }));

    if (selectedTicket?.id) {
      try {
        setIsUpdating(true);
        const updatedData = {
          id: selectedTicket.id,
          deadline: newDeadline,
        };

        await updateTicket(updatedData);
        updateTicketsState(updatedData);
      } catch (error) {
        console.error("Error updating deadline:", error);
        setEditedTicket((prev) => ({
          ...prev,
          deadline: selectedTicket.deadline || "",
        }));
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleTagChange = async (e) => {
    if (!canEditTicket()) return;
    const newTag = e.target.value;
    setEditedTicket((prev) => ({ ...prev, tag: newTag }));

    if (selectedTicket?.id) {
      try {
        setIsUpdating(true);
        const updatedData = {
          id: selectedTicket.id,
          tag: newTag,
        };

        await updateTicket(updatedData);
        updateTicketsState(updatedData);
      } catch (error) {
        console.error("Error updating tag:", error);
        setEditedTicket((prev) => ({ ...prev, tag: selectedTicket.tag || "" }));
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const startEditingTitle = () => {
    if (!canEditTicket()) return;
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTicket((prev) => ({
      ...prev,
      title: selectedTicket?.title || "",
    }));
  };

  const saveTitle = async () => {
    if (!editedTicket.title.trim()) {
      setEditedTicket((prev) => ({
        ...prev,
        title: selectedTicket?.title || "",
      }));
      setIsEditingTitle(false);
      return;
    }

    if (selectedTicket?.id) {
      try {
        setIsUpdating(true);
        const updatedData = {
          id: selectedTicket.id,
          title: editedTicket.title.trim(),
        };

        await updateTicket(updatedData);
        updateTicketsState(updatedData);

        setIsEditingTitle(false);
      } catch (error) {
        console.error("Error updating title:", error);
        setEditedTicket((prev) => ({
          ...prev,
          title: selectedTicket.title || "",
        }));
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // For immediate testing, let's also add a function to handle direct file input
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.indexOf("image") === 0);

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        handleImageUpload(file);
      });
    }

    // Reset the input
    e.target.value = "";
  };

  // Add a function to the toolbar for image upload
  const uploadImage = () => {
    // Create an input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    // Add event listener
    input.onchange = handleFileInputChange;

    // Trigger click to open file dialog
    input.click();
  };

  // Modify your EditorToolbar function to include table row/column controls
  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? styles.isActive : ""}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? styles.isActive : ""}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? styles.isActive : ""}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive("highlight") ? styles.isActive : ""}
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive("heading", { level: 1 }) ? styles.isActive : ""
            }
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 }) ? styles.isActive : ""
            }
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive("paragraph") ? styles.isActive : ""}
            title="Paragraph"
          >
            <Type size={16} />
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? styles.isActive : ""}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? styles.isActive : ""}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? styles.isActive : ""}
            title="Code Block"
          >
            <Code size={16} />
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={
              editor.isActive({ textAlign: "left" }) ? styles.isActive : ""
            }
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? styles.isActive : ""
            }
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? styles.isActive : ""
            }
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            onClick={setLink}
            className={editor.isActive("link") ? styles.isActive : ""}
            title="Link"
          >
            <LinkIcon size={16} />
          </button>
          <button onClick={uploadImage} title="Upload Image">
            <ImageIcon size={16} />
          </button>
          <button onClick={addTable} title="Insert Table">
            <TableIcon size={16} />
          </button>

          {/* Add table row/column controls - only visible when a table is selected */}
          {editor.isActive('table') && (
            <>
              <button onClick={addTableRow} title="Add Row">
                <span>+ Row</span>
              </button>
              <button onClick={deleteTableRow} title="Delete Row">
                <span>- Row</span>
              </button>
              <button onClick={addTableColumn} title="Add Column">
                <span>+ Col</span>
              </button>
              <button onClick={deleteTableColumn} title="Delete Column">
                <span>- Col</span>
              </button>
            </>
          )}
        </div>

        <div className={styles.toolbarSpacer}></div>

        <div className={styles.toolbarGroup}>
          {/* <button
                        onClick={handleManualSave}
                        title="Save Content"
                        className={styles.saveButton}
                    >
                        <Save size={16} />
                        {isSavingContent ? ' Saving...' : ' Save'}
                    </button> */}
        </div>
      </div>
    );
  };

  // Get available tag names from the tags array
  const availableTags = tags.map((tag) => tag.name);

  // Update handlePICConfirmation
  const handlePICConfirmation = async () => {
    if (!isPIC || !selectedTicket?.id) return;

    try {
      setIsUpdating(true);
      const newReviewStatus = !completionStatus;

      // Get current status before updating
      const oldStatus = selectedTicket.status || STATUS_PENDING;

      // Determine new status
      const newStatus = newReviewStatus ? STATUS_REVIEW : STATUS_PENDING;

      // Immediately update UI
      setCompletionStatus(newReviewStatus);
      setLocalStatus(newStatus);

      const updatedData = {
        id: selectedTicket.id,
        review: newReviewStatus,
        status: newStatus,
        completed: false, // Reset completed status when changing review
      };

      // Update selectedTicket in state immediately
      setSelectedTicket(prev => ({
        ...prev,
        ...updatedData
      }));

      // Update the ticket in the database
      await updateTicket(updatedData);

      // Send email notification about status change
      if (selectedTicket.pic) {
        // Get the user's email preferences from userList
        const picUser = userList.find(user =>
          user.email === selectedTicket.pic ||
          user.email.split('@')[0] === selectedTicket.pic.split('@')[0]
        );

        // Only send email if the user has enabled status change notifications
        if (picUser && picUser.isSendEmail) {
          const emailData = {
            to: selectedTicket.pic,
            companyName: "Gateway Dashboard", // You may want to get actual company name
            ticket_id: selectedTicket.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            ticketTitle: selectedTicket.title,
            ticketUrl: `${window.location.origin}/gateway?ticket=${selectedTicket.id}`,
            changedBy: currentUser?.nickName || currentUser?.name || currentUser?.email?.split("@")[0],
            changeDate: new Date().toISOString(),
            remarks: newReviewStatus ? "Ticket đã được gửi để review" : "Ticket đã được hủy trạng thái review"
          };

          try {
            await sendChangeStatusTicket(emailData);
          } catch (emailError) {
            console.error("Error sending status change email:", emailError);
            // Continue with the function even if email fails
          }
        }
      }

      // Update tickets state
      updateTicketsState(updatedData);
    } catch (error) {
      // Revert UI on error
      setCompletionStatus(selectedTicket.review || false);
      setLocalStatus(selectedTicket.status || "");
      console.error("Error updating review status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update handleConfirm
  const handleConfirm = async () => {
    if (!permission?.isConfirm || !selectedTicket?.id || !selectedTicket.review) return;

    try {
      setIsConfirming(true);
      const newCompletedStatus = !selectedTicket.completed;

      // Get current status before updating
      const oldStatus = selectedTicket.status;

      // Determine new status
      const newStatus = newCompletedStatus ? STATUS_COMPLETED : STATUS_REVIEW;

      // Immediately update UI
      const updatedData = {
        id: selectedTicket.id,
        completed: newCompletedStatus,
        status: newStatus,
        review: selectedTicket.review, // Keep the current review status
      };

      // Update selectedTicket in state immediately
      setSelectedTicket(prev => ({
        ...prev,
        ...updatedData
      }));

      setLocalStatus(updatedData.status);

      // Update the ticket in the database
      await updateTicket(updatedData);

      // Send email notification about status change
      if (selectedTicket.pic) {
        // Get the user's email preferences from userList
        const picUser = userList.find(user =>
          user.email === selectedTicket.pic ||
          user.email.split('@')[0] === selectedTicket.pic.split('@')[0]
        );

        // Only send email if the user has enabled status change notifications
        if (picUser && picUser.isSendEmail) {
          const emailData = {
            to: selectedTicket.pic,
            companyName: "Gateway Dashboard", // You may want to get actual company name
            ticket_id: selectedTicket.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            ticketTitle: selectedTicket.title,
            ticketUrl: `${window.location.origin}/gateway?ticket=${selectedTicket.id}`,
            changedBy: currentUser?.nickName || currentUser?.name || currentUser?.email?.split("@")[0],
            changeDate: new Date().toISOString(),
            remarks: newCompletedStatus ? "Ticket đã được duyệt hoàn thành" : "Ticket đã được hủy trạng thái hoàn thành"
          };

          try {
            await sendChangeStatusTicket(emailData);
          } catch (emailError) {
            console.error("Error sending status change email:", emailError);
            // Continue with the function even if email fails
          }
        }
      }

      // Update tickets state
      updateTicketsState(updatedData);
    } catch (error) {
      // Revert UI on error
      setSelectedTicket(prev => ({
        ...prev,
        completed: !newCompletedStatus,
        status: !newCompletedStatus ? STATUS_COMPLETED : STATUS_REVIEW,
        review: selectedTicket.review // Keep the current review status
      }));
      setLocalStatus(selectedTicket.status);
      console.error("Error updating completion status:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle PIC change
  const handlePICChange = async (e) => {
    if (!canEditTicket()) return;

    // Get the username from the select value
    const selectedUsername = e.target.value;

    // Find the complete email for the selected user
    let fullEmail = selectedUsername;
    if (selectedUsername) {
      const selectedUser = userList.find(user =>
        user.email.split('@')[0].toLowerCase() === selectedUsername.toLowerCase()
      );

      if (selectedUser) {
        fullEmail = selectedUser.email; // Store complete email
      } else {
        // Fallback if user not found, append domain
        fullEmail = `${selectedUsername}@xichtho-vn.com`;
      }
    }

    if (selectedTicket?.id) {
      try {
        setIsUpdating(true);
        const updatedData = {
          id: selectedTicket.id,
          pic: fullEmail, // Store the full email
        };

        // Update the ticket in the database
        await updateTicket(updatedData);

        // Update the selectedTicket state directly to include the new PIC
        setSelectedTicket(prev => ({
          ...prev,
          pic: fullEmail
        }));

        // Also update the tickets list
        updateTicketsState(updatedData);
      } catch (error) {
        console.error("Error updating PIC:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Add new handler for reset
  const handleReset = async () => {
    if (!permission?.isResetStatus || !selectedTicket?.id) return;

    try {
      setIsResetting(true);

      // Get current status before updating
      const oldStatus = selectedTicket.status;

      // Determine new status (always pending when reset)
      const newStatus = STATUS_PENDING;

      const updatedData = {
        id: selectedTicket.id,
        warning: true,
        completed: false,
        review: false,
        status: newStatus
      };

      // Update selectedTicket in state immediately
      setSelectedTicket(prev => ({
        ...prev,
        ...updatedData
      }));

      setLocalStatus(updatedData.status);

      // Update the ticket in the database
      await updateTicket(updatedData);

      // Send email notification about status change
      if (selectedTicket.pic) {
        // Get the user's email preferences from userList
        const picUser = userList.find(user =>
          user.email === selectedTicket.pic ||
          user.email.split('@')[0] === selectedTicket.pic.split('@')[0]
        );

        // Only send email if the user has enabled status change notifications
        if (picUser && picUser.isSendEmail) {
          const emailData = {
            to: selectedTicket.pic,
            companyName: "Gateway Dashboard", // You may want to get actual company name
            ticket_id: selectedTicket.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            ticketTitle: selectedTicket.title,
            ticketUrl: `${window.location.origin}/gateway?ticket=${selectedTicket.id}`,
            changedBy: currentUser?.nickName || currentUser?.name || currentUser?.email?.split("@")[0],
            changeDate: new Date().toISOString(),
            remarks: "Ticket đã được reset về trạng thái ban đầu"
          };

          try {
            await sendChangeStatusTicket(emailData);
          } catch (emailError) {
            console.error("Error sending status change email:", emailError);
            // Continue with the function even if email fails
          }
        }
      }

      // Update tickets state
      updateTicketsState(updatedData);
    } catch (error) {
      // Revert UI on error
      setSelectedTicket(prev => ({
        ...prev,
        warning: selectedTicket.warning,
        completed: selectedTicket.completed,
        review: selectedTicket.review,
        status: selectedTicket.status
      }));
      setLocalStatus(selectedTicket.status);
      console.error("Error resetting ticket:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      // Show some loading state if needed

      // Upload the file using uploadFileService
      const response = await uploadFileService(file, (progress) => {
        // Optional: you can show upload progress here
        console.log(`Upload progress: ${progress}%`);
      });

      if (!response || !response.files || response.files.length === 0) {
        throw new Error("Failed to upload image: No files returned");
      }

      // Get the first file's URL from the response
      const fileData = response.files[0];
      const permanentUrl = fileData.fileUrl;

      if (!permanentUrl) {
        throw new Error("Invalid file URL returned from server");
      }

      // Insert the image with the permanent URL directly
      editor.chain().focus().setImage({ src: permanentUrl }).run();

      // Get the updated content with the permanent URL and save it
      const updatedContent = editor.getHTML();
      handleNoteContentChange(updatedContent);
    } catch (error) {
      console.error("Error uploading image:", error);
      // You might want to show an error notification here
    }
  };

  // Add a state to track which ticket's link has been copied
  const [copiedTicketId, setCopiedTicketId] = useState(null);


  // Add this function to handle URL copying
  const handleCopy = (ticketId) => {
    if (!ticketId) {
      console.error("Không có ID để sao chép!");
      return;
    }

    const urlToCopy = `${window.location.origin}/gateway?ticket=${ticketId}`;
    navigator.clipboard.writeText(urlToCopy)
        .then(() => {
          // Show success feedback for this ticket
          setCopiedTicketId(ticketId);

          // Reset the copied state after 2 seconds
          setTimeout(() => {
            setCopiedTicketId(null);
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        {isEditingTitle ? (
          <div className={styles.titleEditContainer}>
            <input
              type="text"
              name="title"
              value={editedTicket.title}
              onChange={handleInputChange}
              className={styles.titleInput}
              autoFocus
              disabled={isUpdating}
            />
            <div className={styles.titleEditActions}>
              <button
                className={styles.saveButton}
                onClick={saveTitle}
                disabled={isUpdating}
                title="Lưu"
              >
                <Check size={16} color="green" />
              </button>
              <button
                className={styles.cancelButton}
                onClick={cancelEditingTitle}
                disabled={isUpdating}
                title="Hủy"
              >
                <X size={16} color="red" />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.titleContainer}>
            <div className={styles.title}>{selectedTicket?.title}</div>
            {canEditTicket() && (
              <button
                className={styles.editTitleButton}
                onClick={startEditingTitle}
                title={!canEditTicket() ? "Guests can only edit customer tickets" : "Chỉnh sửa tiêu đề"}
              >
                <Edit2 size={16} color="#666" />
              </button>
            )}
          </div>
        )}
        <div className={styles.status}>{localStatus}</div>
        <button
            className={styles.copyButton}
            onClick={() => handleCopy(selectedTicket?.id)}
            title="Copy ID"
        >
          {copiedTicketId === selectedTicket?.id ? (
              <CheckCheck size={16} color="green" />
          ) : (
              <MdContentCopy size={16} color="#666" />
          )}
        </button>
      </div>

      <div className={styles.info}>
        <div className={styles.pic}>
          {selectedTicket ? (
            <select
              value={selectedTicket.pic ? (
                selectedTicket.pic.includes('@') ?
                  selectedTicket.pic.split('@')[0].toLowerCase() :
                  selectedTicket.pic.toLowerCase()
              ) : ""}
              onChange={handlePICChange}
              className={styles.picSelect}
              disabled={isUpdating || !canEditTicket()}
              title={!canEditTicket() ? "Guests can only edit customer tickets" : "Change PIC"}
            >
              <option value="">No PIC</option>
              {userList && userList.map((user, index) => {
                const username = user.email.split('@')[0].toLowerCase();
                return (
                  <option key={index} value={username}>
                    {username}
                  </option>
                );
              })}
            </select>
          ) : (
            ""
          )}
        </div>

        <div className={styles.pic}>
          {selectedTicket ? (
            <input
              type="date"
              value={editedTicket.deadline}
              onChange={handleDeadlineChange}
              className={styles.dateInput}
              disabled={isUpdating || !canEditTicket()}
              title={!canEditTicket() ? "Guests can only edit customer tickets" : "Change deadline"}
            />
          ) : (
            ""
          )}
        </div>

        <div className={styles.pic}>
          {selectedTicket ? (
            <select
              value={editedTicket.tag}
              onChange={handleTagChange}
              className={styles.tagSelect}
              disabled={isUpdating || !canEditTicket()}
              title={!canEditTicket() ? "Guests can only edit customer tickets" : "Change tag"}
            >
              <option value="">No Tag</option>
              {availableTags.map((tagName, index) => (
                <option key={index} value={tagName}>
                  {tagName}
                </option>
              ))}
            </select>
          ) : (
            ""
          )}
        </div>

        <div className={styles.pic}></div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentHeader}>
          <div className={styles.label}>Nội dung</div>
          {/*<div className={styles.saveStatus}>*/}
          {/*  {isSavingContent ? "Đang lưu..." : "Đã lưu"}*/}
          {/*</div>*/}
          <button className={styles.dropdownButton} onClick={toggleDropdown}>
          {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {selectedTicket && (
          <div className={styles.editorContainer}>
            {isDropdownOpen && <EditorToolbar />}
            <EditorContent editor={editor} className={styles.tiptapEditor} />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.attach}>
          <Paperclip color="#454545" size={17} style={{ cursor: "pointer" }} />
          <span>2</span>
        </div>

        <div className={styles.footerSpacer}></div>

        {/* Add Reset button */}
        {permission?.isResetStatus && (
          <button
            className={`${styles.confirmButton} ${styles.resetButton}`}
            onClick={handleReset}
            disabled={isResetting}
            style={{ marginRight: '10px' }}
            title="Reset ticket status"
          >
            {isResetting ? (
              <span className={styles.smallLoader}></span>
            ) : (
              "Reset"
            )}
          </button>
        )}

        {/* Duyệt button for completion - only show when review is true */}
        {permission?.isConfirm && (
          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isConfirming || !selectedTicket?.review} // Add review check here
            style={{
              marginRight: '10px',
              opacity: selectedTicket?.review ? 1 : 0.5 // Visual feedback for review state
            }}
            title={
              !selectedTicket?.review
                ? "Ticket must be in review state"
                : selectedTicket?.completed
                  ? "Undo completion"
                  : "Mark as completed"
            }
          >
            {isConfirming ? (
              <span className={styles.smallLoader}></span>
            ) : selectedTicket?.completed ? (
              "Hủy duyệt"
            ) : (
              "Duyệt"
            )}
          </button>
        )}

        {/* PIC confirmation button for review */}
        <button
          className={styles.confirmButton}
          onClick={handlePICConfirmation}
          disabled={!isPIC || isUpdating}
          title={
            !isPIC
              ? "Only the PIC can review this ticket"
              : completionStatus
                ? "Cancel review"
                : "Submit for review"
          }
        >
          {isUpdating ? (
            <span className={styles.smallLoader}></span>
          ) : completionStatus ? (
            "Hủy xác nhận"
          ) : (
            "Xác nhận"
          )}
        </button>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.linkModal}>
            <h3>Insert Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className={styles.linkInput}
            />
            <div className={styles.linkActions}>
              <button
                onClick={confirmLink}
                className={styles.confirmLinkButton}
              >
                Save
              </button>
              <button onClick={cancelLink} className={styles.cancelLinkButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainContent;
