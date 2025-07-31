import React from 'react';
import { Plus, Minus, Settings } from 'lucide-react';
import JsonEditor from '../../ui/JsonEditor';

const EventEditor = ({ formData, onUpdateData, openJsonModal }) => {
 const addEvent = () => {
  const currentEvents = formData.events || [];
  const newEvent = {
   eventRefs: ['example_event'],
   actions: [],
  };
  const updatedData = { ...formData, events: [...currentEvents, newEvent] };
  onUpdateData(updatedData);
 };

 const removeEvent = (index) => {
  const currentEvents = formData.events || [];
  const newEvents = currentEvents.filter((_, i) => i !== index);
  const updatedData = { ...formData, events: newEvents };
  onUpdateData(updatedData);
 };

 const handleEventChange = (index, field, value) => {
  const currentEvents = [...(formData.events || [])];
  currentEvents[index] = { ...currentEvents[index], [field]: value };
  const updatedData = { ...formData, events: currentEvents };
  onUpdateData(updatedData);
 };

 const handleEventRefsChange = (eventIndex, value) => {
  const eventRefs = value.split(',').map(ref => ref.trim()).filter(ref => ref);
  handleEventChange(eventIndex, 'eventRefs', eventRefs);
 };

 const addEventAction = (eventIndex) => {
  const currentEvents = [...(formData.events || [])];
  const event = { ...currentEvents[eventIndex] };
  const currentActions = event.actions || [];
  const newAction = {
   name: `action${currentActions.length + 1}`,
   functionRef: {
    refName: 'functionName',
    arguments: {},
   },
  };
  event.actions = [...currentActions, newAction];
  currentEvents[eventIndex] = event;
  const updatedData = { ...formData, events: currentEvents };
  onUpdateData(updatedData);
 };

 const removeEventAction = (eventIndex, actionIndex) => {
  const currentEvents = [...(formData.events || [])];
  const event = { ...currentEvents[eventIndex] };
  const newActions = (event.actions || []).filter((_, i) => i !== actionIndex);
  event.actions = newActions;
  currentEvents[eventIndex] = event;
  const updatedData = { ...formData, events: currentEvents };
  onUpdateData(updatedData);
 };

 const handleEventActionChange = (eventIndex, actionIndex, path, value) => {
  const currentEvents = [...(formData.events || [])];
  const event = { ...currentEvents[eventIndex] };
  const currentActions = [...(event.actions || [])];
  const action = { ...currentActions[actionIndex] };

  if (path.includes('.')) {
   const [parent, child] = path.split('.');
   action[parent] = { ...action[parent], [child]: value };
  } else {
   action[path] = value;
  }

  currentActions[actionIndex] = action;
  event.actions = currentActions;
  currentEvents[eventIndex] = event;
  const updatedData = { ...formData, events: currentEvents };
  onUpdateData(updatedData);
 };

 const handleTimeoutChange = (field, value) => {
  const currentTimeouts = formData.timeouts || {};
  const updatedTimeouts = { ...currentTimeouts, [field]: value };
  const updatedData = { ...formData, timeouts: updatedTimeouts };
  onUpdateData(updatedData);
 };

 return (
  <>
   {/* Events Section */}
   <div className="section">
    <div className="section-header">
     <Settings size={16} />
     <span>Events</span>
     <button className="add-btn" onClick={addEvent}>
      <Plus size={14} />
     </button>
    </div>
    <div className="form-help">
     <small>Define events that this state will wait for</small>
    </div>

    {(formData.events || []).map((event, eventIndex) => (
     <div key={eventIndex} className="event-item">
      <div className="item-header">
       <span>Event {eventIndex + 1}</span>
       <button className="remove-btn" onClick={() => removeEvent(eventIndex)}>
        <Minus size={14} />
       </button>
      </div>

      <div className="form-group">
       <label>Event References (comma-separated)</label>
       <input
        type="text"
        value={(event.eventRefs || []).join(', ')}
        onChange={(e) => handleEventRefsChange(eventIndex, e.target.value)}
        placeholder="event1, event2, event3"
       />
       <div className="form-help">
        <small>List of event names this event state listens to</small>
       </div>
      </div>

      {/* Event Actions */}
      <div className="subsection">
       <div className="subsection-header">
        <span>Actions</span>
        <button
         className="add-btn"
         onClick={() => addEventAction(eventIndex)}
        >
         <Plus size={12} />
        </button>
       </div>

       {(event.actions || []).map((action, actionIndex) => (
        <div key={actionIndex} className="action-item">
         <div className="item-header">
          <span>Action {actionIndex + 1}</span>
          <button
           className="remove-btn"
           onClick={() => removeEventAction(eventIndex, actionIndex)}
          >
           <Minus size={12} />
          </button>
         </div>

         <div className="form-group">
          <label>Name</label>
          <input
           type="text"
           value={action.name || ''}
           onChange={(e) => handleEventActionChange(eventIndex, actionIndex, 'name', e.target.value)}
           placeholder="Action name"
          />
         </div>

         <div className="form-group">
          <label>Function Reference</label>
          <input
           type="text"
           value={action.functionRef?.refName || ''}
           onChange={(e) => handleEventActionChange(eventIndex, actionIndex, 'functionRef.refName', e.target.value)}
           placeholder="Function name"
          />
         </div>

         <JsonEditor
          label="Arguments (JSON)"
          value={action.functionRef?.arguments}
          onChange={(value) => handleEventActionChange(eventIndex, actionIndex, 'functionRef.arguments', value)}
          placeholder='{"key": "value"}'
          height="120px"
          onOpenModal={() => openJsonModal(
           action.functionRef?.arguments,
           (value) => handleEventActionChange(eventIndex, actionIndex, 'functionRef.arguments', value),
           `Event Action Arguments - ${action.name || `Action ${actionIndex + 1}`}`,
           "Event Action Arguments (JSON)"
          )}
         />
        </div>
       ))}

       {(!event.actions || event.actions.length === 0) && (
        <div className="no-actions">
         <span>No actions defined for this event yet</span>
        </div>
       )}
      </div>
     </div>
    ))}

    {(!formData.events || formData.events.length === 0) && (
     <div className="no-events">
      <span>No events defined yet</span>
     </div>
    )}
   </div>

   {/* Timeouts Section */}
   <div className="section">
    <div className="section-header">
     <span>Timeouts</span>
    </div>
    <div className="form-help">
     <small>Configure timeout behavior for event processing</small>
    </div>

    <div className="form-group">
     <label>Event Timeout (ISO 8601 Duration)</label>
     <input
      type="text"
      value={formData.timeouts?.eventTimeout || ''}
      onChange={(e) => handleTimeoutChange('eventTimeout', e.target.value)}
      placeholder="PT30M"
     />
     <div className="form-help">
      <small>Maximum time to wait for events (e.g., PT30M for 30 minutes)</small>
     </div>
    </div>

    <div className="form-group">
     <label>Action Execution Timeout (ISO 8601 Duration)</label>
     <input
      type="text"
      value={formData.timeouts?.actionExecutionTimeout || ''}
      onChange={(e) => handleTimeoutChange('actionExecutionTimeout', e.target.value)}
      placeholder="PT15M"
     />
     <div className="form-help">
      <small>Maximum time for action execution (e.g., PT15M for 15 minutes)</small>
     </div>
    </div>
   </div>
  </>
 );
};

export default EventEditor; 