import { Dialog } from '@mui/material';
import AccountingJournalForm from './AccountingJournalForm.jsx';
import Project from '../../sheets/DanhMuc/Project.jsx';
import ProjectForm from './ProjectForm.jsx';

const FormAddDialog = ({ open, onClose, table, onGridReady, company }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <ProjectForm onClose={onClose} />
      {table === 'SoKeToan' && <AccountingJournalForm onClose={onClose} onGridReady={onGridReady} company={company} />}
      {table === 'Project' && <ProjectForm onClose={onClose} company={company} />}
    </Dialog>
  );
};

export default FormAddDialog;
