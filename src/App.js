import './App.css'
export default function App(){
    return (<div>
        <div >
        <h1>Shrek</h1>
<img src="doc/shrekLogo2.0.png"/>

## Authors:
<div className='textblock'>
Clayton Bruce, Sung Jae Ko, Dylan Lim
</div>
## Description:
<div className='textblock'>
    A compiler for our language Shrek inspired by the DreamWorks Movie Shrek and extended universe. We hope to make coding more memorable by making references to the mistical world of Shrek. As Shrek fans, we also hope also to make coding more enjoyable for shrek fans by including references to the movies and also using some ogre dialect.

    Shrek uses types, curley brace styling, and variable scope modifiers like Java
</div>


## Features:

<div className='textblock'>
    {`
    Shrek allows users to declare variables as follows, fairly similarly to Java:
    
    Shrek:
    enchanted Shilling x ~ 3
    
    Java:
    public int x = 3;

    Shrek however, distinguishes assignment by reference (using "->") and assignment by value (using "~")
    `}
</div>
<div className='textblock'>
    {`Shrekk-- also uses pythonic list comprehensions (shout out https://lingojam.com/ShrekSlang). 
    
    Shrek:
    ((x) {whitevur (truth) {return x}} fur list)
    
    Python:
    [x for x in list if true]`}
</div>

<div className='textblock'>
    {`Shrekk-- easily allows for binary operations on Types. 
    
    Shrek:
    cursed Any-Shilling a ~ "3 bling mice";

    cursed Shilling + Str + Pinoccio a ~ 4;`}
    
</div>
## Examples:
<div className='textblock'>
    {`

    shilling = int
    enchanted = public
    cursed = private
    Donkey = String
    Pinoccio = boolean
    truth = true
    lie = false
    Ogre = Class`}
    </div>
    
    ## About The Authors:
    <div className='textblock'>
    {`

Clayton Bruce is an Oregonian who grew up watching Shrek and other DreamWorks films. He likes coding with python and js and hopes to bridge these languages with the Shrek franchise.

Sung Jae Ko is born and raised on the island of Oahu with a passion for nature. He hikes, runs, paddles, and swims, but don't let those activities outshine his love for technology and Shrek. Just as Shrek loves his alone time, Sung Jae loves his walks a beautiful scenery.

Dylan Lim was born in Oakland and raised in San Marino. He recently watched Puss in Boots which was the inspiration for the language. His hobbies include sports (alot of them), computers, and many small hyperfixations.`}
    </div>
    </div>
</div>)
}