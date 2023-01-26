const rows_options = ['Client', 'Cost Code', 'Source Language', 'Target Language', 'LxD Region', 'LD Cost Centre']
const values_options = ['all words', 'Post-Editing words', 'non Post-Editing words'] 
const dashboard_id = '637f99dc8fbb4c003606e81b'
const blox_widget_id = '637f99dc8fbb4c003606e81d'
// id of the widget we want to modify with the buttons
const widget_id = '637f99dc8fbb4c003606e81c'
	
widget.on('ready', () => 
{
	// making dropdown lists visible/invisible after clicking on them
	for (let drop_list_id of ['rows_drop_list', 'values_drop_list', 'saved_configs'])
    {
		let drop_list = document.getElementById(drop_list_id);

		// add class visible to the dropdown list after clicking on it so it become visible
    	// that class 'visible' is used in css file thanks to which that list become visible or not
		drop_list.getElementsByClassName('anchor')[0].onclick = function(evt) 
        {
			if (drop_list.classList.contains('visible'))
				drop_list.classList.remove('visible');
			else
				drop_list.classList.add('visible');
		}
	}

    // adding options to a dropdown lists with rows, columns and saved configurations to select
    for (let drop_list_id of ['rows_drop_list', 'values_drop_list', 'saved_configs'])
    {
		if (drop_list_id == 'rows_drop_list')
			options = rows_options
		else if (drop_list_id == 'values_drop_list')
			options = values_options
        else
        {
            // loading current saved filters
            // current_saved_blox_configs has format: {dashboard_id: {blox_widget_id: {config_name: [selected_rows, selected_values]}}}
            let current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)
            options = Object.keys(current_saved_blox_configs[dashboard_id][blox_widget_id])
        }
			
		// element with options to choose in the dropdown list
		let drop_list_ul = document.getElementById(drop_list_id).querySelector('ul')

		for (let option of options)
        {
            if (drop_list_id == 'saved_configs')
                add_button(option, drop_list_ul, event_listener_saved_config_button)
            else if (drop_list_id == 'rows_drop_list')
                add_button(option, drop_list_ul, event_listener_select_rows)
            else if (drop_list_id == 'values_drop_list')
                add_button(option, drop_list_ul, event_listener_select_columns)
		}
	}
    

    // adding functions to the buttons
    let buttons_select_rows = document.getElementById('rows_drop_list').querySelectorAll('button')
    let buttons_select_columns = document.getElementById('values_drop_list').querySelectorAll('button')
	let button_apply = document.getElementById('apply')
	let button_reset = document.getElementById('reset')
	let button_save = document.getElementById('save_config')
	let button_remove = document.getElementById('remove_config')

	
    // adding function to the apply button
	button_apply.addEventListener('click', () => {
        // finding widget in the prism object with table we want to modify
		let widget = prism.activeDashboard.widgets.$$widgets.find(w => w.oid === widget_id);
		let widget_title = 'Number of adjusted words'
		
		for (let [i, list_id] of ['selected_rows', 'selected_values'].entries()){
			// finding object in prism with parameters for table
			let items = widget.metadata.panels[i].items
            // selected values from the list with rows/columns
			let selected_values = Array.from(document.getElementById(list_id).querySelectorAll('li')).map((el) => (el.textContent))

			// disabling all items
            for (let item of items)
            {
                item.disabled = true
            }

            // enabling selected items and changing their order into order they were selected
            for (let [j, selected_value] of selected_values.entries())
            {
                for (let [k, item] of items.entries())
                {
                    if (item.jaql.title != selected_value)
                        continue
                    else
                    {
                        item.disabled = false
                        items[k] = items[j]
                        items[j] = item
                    }
                }
            }
			
			
			// change widget title
			if (list_id == 'selected_values'){
				for (let selected_value of selected_values){
					if (widget_title.split(' ').at(-2) == 'adjusted')
						widget_title += ': '
					else
						widget_title += ', '
					widget_title += selected_value
				}
				widget.title = widget_title
			}
		}

        widget.changesMade();
		widget.refresh();
    })
	
	// remove inscriptions from selected rows/columns list
	button_reset.addEventListener('click', () => {
		let ul_rows = document.getElementById('selected_rows')
		let ul_columns = document.getElementById('selected_values')
		
		while (ul_rows.lastChild.textContent != 'Selected rows:')
			ul_rows.removeChild(ul_rows.lastChild)
			
		while (ul_columns.lastChild.textContent != 'Selected values:')
			ul_columns.removeChild(ul_columns.lastChild)
	})
	
	// adding function to save configuration button
	button_save.addEventListener('click', () => {
		let input_field = document.getElementById('input_config_name_to_save')
		let config_name = input_field.value
        // clear input field
        input_field.value = ''
		let selected_rows = Array.from(document.getElementById('selected_rows').querySelectorAll('li')).map(li_element => li_element.textContent)
		let selected_values = Array.from(document.getElementById('selected_values').querySelectorAll('li')).map(li_element => li_element.textContent)

        if (selected_rows.length == 0 | selected_values.length == 0)
        {
            alert("you didn't select any rows or columns")
            return
        }

		// loading current saved filters
        // current_saved_blox_configs has format: {dashboard_id: {blox_widget_id: your_object}}
        let current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)
			
		// check if a selected configuration name is already used
		if (Object.keys(current_saved_blox_configs[dashboard_id][blox_widget_id]).includes(config_name)){
			alert('Configuration name is already used, pick a new one or remove the old configuration')
			return
		}
			
		// adding a new configuration
		current_saved_blox_configs[dashboard_id][blox_widget_id][config_name] = [selected_rows, selected_values]
			
        // saving info about saved configurations in a localStorage for future usage
		localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)

		// creating new button which will be shown on a dropdown list 'saved configurations'
        let ul_saved_configs = document.getElementById('saved_configs').querySelector('ul')
        add_button(config_name, ul_saved_configs, event_listener_saved_config_button)
	})
	
	
	// adding function to remove saved configuration
	button_remove.addEventListener('click', () => {
		let input_field = document.getElementById('input_config_name_to_remove')
		let config_name = input_field.value
		input_field.value = ''
		
		// updating info about saved configurations in a localStorage
        // current_saved_blox_configs has format: {dashboard_id: {blox_widget_id: your_object}}
        let current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)
			
		delete current_saved_blox_configs[dashboard_id][blox_widget_id][config_name]
		localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)
		
		// removing button with configuration to remove
		let li_saved_configs = document.getElementById('saved_configs').querySelectorAll('li')
		
		for (let li_element of li_saved_configs){
			if (li_element.querySelector('button').textContent == config_name){
				li_element.remove()
				break
			}
		}
	})
})



// functions

// adding new li element with the button with given text and given event listener to the given ul object 
function add_button(button_text, ul_object, event_listener)
{
    let li_element = document.createElement('li')
    let new_button = document.createElement('button')
    
    new_button.value = new_button.textContent = button_text
    new_button.classList.add('my_button')
    new_button.style.width = '195px'
    new_button.style.marginTop = '5px'
	new_button.style.textAlign = 'center'
	new_button.style.padding = '5px 0px 5px 0px'
    
    // after clicking on the button show selected rows and columns in lists
    new_button.addEventListener('click', event_listener)
    
    li_element.appendChild(new_button)
    ul_object.appendChild(li_element)
}


function event_listener_saved_config_button(button)
{
    let config_name = button.target.value

    let [selected_rows, selected_values] = JSON.parse(localStorage['blox_saved_configs'])[dashboard_id][blox_widget_id][config_name]
    let selected_rows_list = document.getElementById('selected_rows')
    let selected_values_list = document.getElementById('selected_values')

    // remove all selected rows/columns from the list
    while (selected_rows_list.lastChild.textContent != 'Selected rows:')
    {
        selected_rows_list.removeChild(selected_rows_list.lastChild)
    }

    while (selected_values_list.lastChild.textContent != 'Selected values:')
    {
        selected_values_list.removeChild(selected_values_list.lastChild)
    }

    for (let selected_row of selected_rows)
    {
        let new_li_element = create_li_selected_value(selected_row)
        selected_rows_list.appendChild(new_li_element)
    }

    for (let selected_value of selected_values)
    {
        let new_li_element = create_li_selected_value(selected_value)
        selected_values_list.appendChild(new_li_element)
    }
}



// event listener for buttons with options for rows to choose
function event_listener_select_rows(button)
{
    let selected_value = button.target.value
    let selected_rows_list = document.getElementById('selected_rows')
    
    // check if selected value is already in the list
    for (let li of selected_rows_list.querySelectorAll('li'))
    {
        if (li.textContent == selected_value)
        {
            li.remove()
            return
        }
    }

    let new_li_element = create_li_selected_value(selected_value)
    selected_rows_list.appendChild(new_li_element)
}


// event listener for buttons with options for columns to choose
function event_listener_select_columns(button)
{
    let selected_value = button.target.value
    let selected_values_list = document.getElementById('selected_values')
    
    // check if selected value is already in the list
    for (let li of selected_values_list.querySelectorAll('li'))
    {
        if (li.textContent == selected_value)
        {
            li.remove()
            return
        }
    }
    
    let new_li_element = create_li_selected_value(selected_value)
    selected_values_list.appendChild(new_li_element)
}

// function for creating new li element with selected value in lists selected rows / values
function create_li_selected_value(textContent){
    let new_li_element = document.createElement('li')
    new_li_element.textContent = textContent
	new_li_element.style.paddingTop = new_li_element.style.paddingBottom = '5px'

    return new_li_element
}

// loading saved configurations
function load_saved_blox_configurations(dashboard_id, blox_widget_id){
    // current_saved_blox_configs has format: {dashboard_id: {blox_widget_id: {config_name: [selected_rows, selected_values]}}}
    let current_saved_blox_configs

    if (localStorage['blox_saved_configs'] == undefined)
    {
        current_saved_blox_configs = {}
        current_saved_blox_configs[dashboard_id] = {}
        current_saved_blox_configs[dashboard_id][blox_widget_id] = {}
    }
    else
        current_saved_blox_configs = JSON.parse(localStorage['blox_saved_configs'])

    if (current_saved_blox_configs[dashboard_id] == undefined)
    {
        current_saved_blox_configs[dashboard_id] = {}
        current_saved_blox_configs[dashboard_id][blox_widget_id] = {}
    }
    else if (current_saved_blox_configs[dashboard_id][blox_widget_id] == undefined)
        current_saved_blox_configs[dashboard_id][blox_widget_id] = {}

    return current_saved_blox_configs
}

















































