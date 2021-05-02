
load('api_timer.js');
load('api_mqtt.js');
load('api_gpio.js');
load('api_pwm.js');


// command:	st=stop, fd=forward, bk=backward, rt=right turn, lt= left turn
let BUTTON_FD = 26;
let BUTTON_BK = 27;
let BUTTON_LT = 16;
let BUTTON_RT = 17;

let topic_command = '/mosiotrover/command';


// GPIO init

//GPIO.setup_output(MOTOR_FL_PIN_A,0);
//GPIO.setup_output(MOTOR_FL_PIN_B,0);



// ************************************************
// Publish to MQTT server topic to command
// ************************************************

GPIO.set_button_handler(BUTTON_FD, GPIO.PULL_NONE, GPIO.INT_EDGE_ANY, 20, function() {
  
  if( GPIO.read(BUTTON_FD) )
  {
  	let res = MQTT.pub(topic_command, 'fd', 1);
  	print('FORWARD');
  	print('Published:', res ? 'yes' : 'no');
  }
  else
  {
	let res = MQTT.pub(topic_command, 'st', 1);
  	print('STOP');
  	print('Published:', res ? 'yes' : 'no');
  }
}, null);

GPIO.set_button_handler(BUTTON_BK, GPIO.PULL_NONE, GPIO.INT_EDGE_ANY, 20, function() {
  
  if( GPIO.read(BUTTON_BK) )
  {
  	let res = MQTT.pub(topic_command, 'bk', 1);
  	print('BACKWARD');
  	print('Published:', res ? 'yes' : 'no');
  }
  else
  {
	let res = MQTT.pub(topic_command, 'st', 1);
  	print('STOP');
  	print('Published:', res ? 'yes' : 'no');
  }
    
}, null);

GPIO.set_button_handler(BUTTON_RT, GPIO.PULL_NONE, GPIO.INT_EDGE_ANY, 20, function() {
  
  if( GPIO.read(BUTTON_RT) )
  {
  	let res = MQTT.pub(topic_command, 'rt', 1);
  	print('RIGHT TURN');
  	print('Published:', res ? 'yes' : 'no');
  }
  else
  {
	let res = MQTT.pub(topic_command, 'st', 1);
  	print('STOP');
  	print('Published:', res ? 'yes' : 'no');
  }
    
}, null);

GPIO.set_button_handler(BUTTON_LT, GPIO.PULL_NONE, GPIO.INT_EDGE_ANY, 20, function() {
  
  if( GPIO.read(BUTTON_LT) )
  {
  	let res = MQTT.pub(topic_command, 'lt', 1);
  	print('LEFT TURN');
  	print('Published:', res ? 'yes' : 'no');
  }
  else
  {
	let res = MQTT.pub(topic_command, 'st', 1);
  	print('STOP');
  	print('Published:', res ? 'yes' : 'no');
  }
    
}, null);
