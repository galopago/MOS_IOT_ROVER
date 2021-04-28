
load('api_timer.js');
load('api_mqtt.js');
load('api_gpio.js');
load('api_pwm.js');


// 4 motors (Front Left, Back Left, Front Right, Back Right) , 2 I/O pins for each H-Bridge. 
let MOTOR_FL_PIN_A = 26;
let MOTOR_FL_PIN_B = 27;

let MOTOR_BL_PIN_A = 33;
let MOTOR_BL_PIN_B = 25;

let MOTOR_FR_PIN_A = 16;
let MOTOR_FR_PIN_B = 17;

let MOTOR_BR_PIN_A = 18;
let MOTOR_BR_PIN_B = 19;


let PWM_UPDATE_TICK_MS=100;

let RAMP_TIME_MS = 1000;
let RAMP_STEPS = 10;


let p_command = 'st';	// present command:	st=stop, fd=forward, bk=backward, rt=right turn, lt= left turn
let s_command = 'st';	// set command
let p_speed = 0;		// present speed:	0 to 100%
let s_speed = 0;		// set speed
let d_speed = 0;		// delta speed
let speed_change_flag = 0;

let topic_pwm = '/mosiotrover/pwm';
let topic_frequency = '/mosiotrover/frequency';
let topic_speed = '/mosiotrover/speed';

let pwm = 0;
let frequency = 1000;


// GPIO init

GPIO.setup_output(MOTOR_FL_PIN_A,0);
GPIO.setup_output(MOTOR_FL_PIN_B,0);

GPIO.setup_output(MOTOR_BL_PIN_A,0);
GPIO.setup_output(MOTOR_BL_PIN_B,0);

GPIO.setup_output(MOTOR_FR_PIN_A,0);
GPIO.setup_output(MOTOR_FR_PIN_B,0);

GPIO.setup_output(MOTOR_BR_PIN_A,0);
GPIO.setup_output(MOTOR_BR_PIN_B,0);


// ************************************************
// listen to MQTT server topic to pwm value
// ************************************************

MQTT.sub(topic_pwm,function(conn,topic,msg){
	print('Topic:', topic, 'message:', msg);
	pwm=JSON.parse(msg);
},null);


// ************************************************
// listen to MQTT server topic to pwm frequency
// ************************************************

MQTT.sub(topic_frequency,function(conn,topic,msg){
	print('Topic:', topic, 'message:', msg);
	frequency=JSON.parse(msg);
},null);

// ************************************************
// listen to MQTT server topic to pwm speed
// ************************************************

MQTT.sub(topic_speed,function(conn,topic,msg){
	print('Topic:', topic, 'message:', msg);
	s_speed=JSON.parse(msg);

	//truncating MAX and MIN speed values
	if (s_speed > 100)
		s_speed = 100;
		
	if (s_speed < 0)
		s_speed = 0;
		
},null);


// ************************************************
// update PWM values to IO every  PWM_UPDATE_TICK_MS seconds
// ************************************************

Timer.set(PWM_UPDATE_TICK_MS, Timer.REPEAT, function() {
	pwm = p_speed / 100.0;
	PWM.set(MOTOR_FL_PIN_A,frequency,pwm);
	PWM.set(MOTOR_BL_PIN_A,frequency,pwm);	
	PWM.set(MOTOR_FR_PIN_A,frequency,pwm);	
	PWM.set(MOTOR_BR_PIN_A,frequency,pwm);	
}, null);



// ************************************************
// Ramp calculator to change speed smoothly from actual value to set value
// ************************************************

Timer.set(RAMP_TIME_MS/( RAMP_STEPS*2), Timer.REPEAT, function() {

	if (p_speed !== s_speed && speed_change_flag === 0)
	{
		speed_change_flag = 1;
		d_speed = s_speed - p_speed ;
	}

	if(speed_change_flag === 1)
		{			
			if(d_speed > 0)
				{
					// accelerate
					if(p_speed + (d_speed/(RAMP_STEPS*2)) < s_speed)
					{
						p_speed = p_speed + (d_speed/(RAMP_STEPS*2));
					}					
					else
					{
						p_speed = s_speed;
						speed_change_flag = 0; 
					}
				}
			else
				{
					// deaccelerate
					if(p_speed + (d_speed/(RAMP_STEPS*2)) > s_speed)
					{
						p_speed = p_speed + (d_speed/(RAMP_STEPS*2));
					}
					else
					{
						p_speed = s_speed;
						speed_change_flag = 0; 
					}
				}							
			//print('p_speed:', p_speed, 's_speed:', s_speed);
		}
		
}, null);

