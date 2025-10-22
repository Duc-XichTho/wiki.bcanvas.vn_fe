// LongNoteDialog.jsx
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { addNote2Data, getNote2Data } from '../../../../apisKTQT/note2Service.jsx';

const LongNoteDialog = ({ open, onClose, title, table, company, field, onSave, setOnSave }) => {
  const [note, setNote] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const noteData = await getNote2Data(company, title, table, field);
        if (noteData !== null && noteData.field === field) {
          setNote(noteData.note || '');
        } else {
          setNote('');
        }
      } catch (error) {
       console.log(error)
      }
    };
    fetchData();
  }, [title, table, field, company]);

  const handleSave = async () => {
    try {
      await addNote2Data(company, title, table, field, note);
      setOnSave((prev) => !prev);
      onClose();
      toast.success('Note saved successfully!');
    } catch (error) {
      toast.error('Error saving note: ' + (error.message || 'Unknown error'));
      console.error('Error saving note:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle style={{ fontSize: 15 }}>Ghi chú</DialogTitle>
      <DialogContent >
        <TextField
          autoFocus
          margin="dense"
          label="Note"
          type="text"
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          InputLabelProps={{ style: { fontSize: 15 } }}
          inputProps={{ style: { fontSize: 15 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ fontSize: 15 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} style={{ fontSize: 15 }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LongNoteDialog;
